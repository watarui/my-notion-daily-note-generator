output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.notion_daily_generator.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.notion_daily_generator.arn
}

output "cloudwatch_event_rule_name" {
  description = "Name of the CloudWatch Event Rule"
  value       = aws_cloudwatch_event_rule.schedule.name
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "deployed_region" {
  description = "AWS Region where resources are deployed"
  value       = var.aws_region
}

output "schedule_expression" {
  description = "Schedule expression for the EventBridge rule"
  value       = var.schedule_expression
}
