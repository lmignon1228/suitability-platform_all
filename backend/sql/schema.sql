-- ============================================================
--  suitability_platform  —  PostgreSQL Schema
-- ============================================================

-- 创建数据库（需手动执行或由 init 脚本创建）
-- CREATE DATABASE suitability_db;

-- -----------------------------------------------------------
-- 1. 客户基本信息表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id              VARCHAR(20)  PRIMARY KEY,           -- 客户编号 e.g. 'C00012857'
    name            VARCHAR(50)  NOT NULL,              -- 客户姓名
    questionnaire_level SMALLINT NOT NULL,               -- 问卷测评等级 (1-5)
    predict_level        SMALLINT NOT NULL,               -- 风险预测等级 (1-5)
    assess_time          DATE         NOT NULL,           -- 测评时间
    level_diff           SMALLINT     NOT NULL            -- 差异值 (predict - questionnaire)
);

-- -----------------------------------------------------------
-- 2. 客户风险数据表（JSONB 存储各模块完整数据）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_risk_data (
    customer_id     VARCHAR(20) PRIMARY KEY REFERENCES customers(id),

    -- 适当性总览数据 (SuitabilityOverview.vue)
    overview_kpi          JSONB NOT NULL DEFAULT '[]',
    overview_trend        JSONB NOT NULL DEFAULT '{}',
    overview_radar        JSONB NOT NULL DEFAULT '{}',
    overview_modules      JSONB NOT NULL DEFAULT '[]',
    overview_reasons      JSONB NOT NULL DEFAULT '[]',
    overview_suggestions  JSONB NOT NULL DEFAULT '[]',
    overview_trend_interp TEXT    DEFAULT '',
    overview_radar_interp TEXT    DEFAULT '',

    -- 客观风险承受力数据 (ObjectiveRisk.vue)
    objective_kpi          JSONB NOT NULL DEFAULT '[]',
    objective_trend        JSONB NOT NULL DEFAULT '{}',
    objective_months       JSONB NOT NULL DEFAULT '[]',
    objective_interp       JSONB NOT NULL DEFAULT '{}',
    objective_corr         JSONB NOT NULL DEFAULT '{}',
    objective_market_interp TEXT    DEFAULT '',
    objective_metric       JSONB NOT NULL DEFAULT '[]',

    -- 风险偏好数据 (RiskPreference.vue)
    preference_kpi            JSONB NOT NULL DEFAULT '[]',
    preference_trend          JSONB NOT NULL DEFAULT '{}',
    preference_interp         JSONB NOT NULL DEFAULT '{}',
    preference_scatter        JSONB NOT NULL DEFAULT '[]',
    preference_scatter_interp TEXT    DEFAULT '',
    preference_metric         JSONB NOT NULL DEFAULT '[]',

    -- 风险认知数据 (RiskCognition.vue)
    cognition_kpi              JSONB NOT NULL DEFAULT '[]',
    cognition_trend            JSONB NOT NULL DEFAULT '{}',
    cognition_interp           JSONB NOT NULL DEFAULT '{}',
    cognition_dual_axis        JSONB NOT NULL DEFAULT '{}',
    cognition_dual_axis_interp TEXT    DEFAULT '',
    cognition_metric           JSONB NOT NULL DEFAULT '[]'
);

-- -----------------------------------------------------------
-- 3. 仪表盘统计表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id          SERIAL PRIMARY KEY,
    label       VARCHAR(50) NOT NULL,
    value       VARCHAR(20) NOT NULL,
    bg_class    VARCHAR(30) NOT NULL,
    icon_class  VARCHAR(30) NOT NULL,
    change_text VARCHAR(50) NOT NULL,
    change_class VARCHAR(30) NOT NULL,
    icon_name   VARCHAR(30) NOT NULL,                   -- 图标组件名
    sort_order  SMALLINT DEFAULT 0
);
