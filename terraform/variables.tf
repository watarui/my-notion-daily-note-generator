variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "notion-daily-generator"
}

variable "notion_api_key" {
  description = "Notion API Key"
  type        = string
  sensitive   = true
}

variable "notion_database_id" {
  description = "Notion Database ID"
  type        = string
  sensitive   = true
}

variable "schedule_expression" {
  description = "Schedule expression for the EventBridge rule"
  type        = string
  default     = "cron(8 15 * * ? *)" # 毎日 0:08 JST (15:08 UTC)
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 128
}
