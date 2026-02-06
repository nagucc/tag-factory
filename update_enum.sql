-- 更新 tagfactory_work_plan_records 表的 status 字段 ENUM 类型
ALTER TABLE `tagfactory_work_plan_records` 
  MODIFY COLUMN `status` ENUM('pending', 'tagged', 'skipped') NOT NULL DEFAULT 'pending' COMMENT '状态：pending/tagged/skipped';
