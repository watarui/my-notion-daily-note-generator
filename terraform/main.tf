terraform {
  backend "s3" {
    bucket         = "my-terraform-state-for-my-notion-daily-generator"
    key            = "my-notion-daily-note-generator/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

# CloudWatch Logsのロググループ
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}"
  retention_in_days = 14
}

# Lambda用のIAMロール
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda用のIAMポリシー
resource "aws_iam_policy" "lambda_policy" {
  name = "${var.project_name}-policy"
  path = "/"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "${aws_cloudwatch_log_group.lambda_logs.arn}:*"
      }
    ]
  })
}

# ポリシーをロールにアタッチ
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Lambda関数のデプロイパッケージを作成
data "archive_file" "lambda_package" {
  type        = "zip"
  source_dir  = "${path.module}/../dist"
  output_path = "${path.module}/lambda_function.zip"

  depends_on = [
    null_resource.build_lambda
  ]
}

# Lambda関数のビルド
resource "null_resource" "build_lambda" {
  triggers = {
    source_hash = filesha256("${path.module}/../src")
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/.. && bun run build"
  }
}

# Lambda関数
resource "aws_lambda_function" "notion_daily_generator" {
  function_name    = var.project_name
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.lambda_package.output_path
  source_code_hash = data.archive_file.lambda_package.output_base64sha256
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  environment {
    variables = {
      NOTION_API_KEY = var.notion_api_key
      DATABASE_ID    = var.notion_database_id
      NODE_ENV       = "production"
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    aws_iam_role_policy_attachment.lambda_policy_attachment
  ]
}

# EventBridgeルール
resource "aws_cloudwatch_event_rule" "schedule" {
  name                = "${var.project_name}-schedule"
  description         = "Schedule for Notion Daily Generator"
  schedule_expression = var.schedule_expression
}

# EventBridgeターゲット
resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.schedule.name
  target_id = "LambdaFunction"
  arn       = aws_lambda_function.notion_daily_generator.arn
}

# EventBridgeからLambdaを呼び出す権限
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notion_daily_generator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule.arn
}
