-- ============================================================
--  suitability_platform  —  MySQL Schema
-- ============================================================

-- CREATE DATABASE IF NOT EXISTS suitability_db;
-- USE suitability_db;

-- -----------------------------------------------------------
-- 1. 客户基本信息表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id              VARCHAR(20)  PRIMARY KEY,
    name            VARCHAR(50)  NOT NULL,
    questionnaire_level SMALLINT NOT NULL,
    predict_level        SMALLINT NOT NULL,
    assess_time          DATE         NOT NULL,
    level_diff           SMALLINT     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 2. 客户风险数据表（JSON 存储各模块完整数据）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_risk_data (
    customer_id     VARCHAR(20) PRIMARY KEY,

    -- 适当性总览数据
    overview_kpi          JSON NOT NULL,
    overview_trend        JSON NOT NULL,
    overview_radar        JSON NOT NULL,
    overview_modules      JSON NOT NULL,
    overview_reasons      JSON NOT NULL,
    overview_suggestions  JSON NOT NULL,
    overview_trend_interp VARCHAR(1000)    DEFAULT '',
    overview_radar_interp VARCHAR(1000)    DEFAULT '',

    -- 客观风险承受力数据
    objective_kpi          JSON NOT NULL,
    objective_trend        JSON NOT NULL,
    objective_months       JSON NOT NULL,
    objective_interp       JSON NOT NULL,
    objective_corr         JSON NOT NULL,
    objective_market_interp VARCHAR(1000)    DEFAULT '',
    objective_metric       JSON NOT NULL,

    -- 风险偏好数据
    preference_kpi            JSON NOT NULL,
    preference_trend          JSON NOT NULL,
    preference_interp         JSON NOT NULL,
    preference_scatter        JSON NOT NULL,
    preference_scatter_interp VARCHAR(1000)    DEFAULT '',
    preference_metric         JSON NOT NULL,

    -- 风险认知数据
    cognition_kpi              JSON NOT NULL,
    cognition_trend            JSON NOT NULL,
    cognition_interp           JSON NOT NULL,
    cognition_dual_axis        JSON NOT NULL,
    cognition_dual_axis_interp VARCHAR(1000)    DEFAULT '',
    cognition_metric           JSON NOT NULL,

    FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 3. 仪表盘统计表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    label       VARCHAR(50) NOT NULL,
    value       VARCHAR(20) NOT NULL,
    bg_class    VARCHAR(30) NOT NULL,
    icon_class  VARCHAR(30) NOT NULL,
    change_text VARCHAR(50) NOT NULL,
    change_class VARCHAR(30) NOT NULL,
    icon_name   VARCHAR(30) NOT NULL,
    sort_order  SMALLINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
