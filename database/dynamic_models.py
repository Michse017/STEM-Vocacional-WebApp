"""Dynamic questionnaire models (initial scaffold).

These models implement the flexible, versioned questionnaire architecture.
Currently minimal columns: extend per design document.
They are added to the same SQLAlchemy Base so tables get created idempotently.
Use the environment variable ENABLE_DYNAMIC_QUESTIONNAIRES=1 to activate related blueprints.
"""
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, ForeignKey, Text, UniqueConstraint, JSON, inspect, text, Index
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.models import Base  # Reuse existing Base for unified metadata

# --- Core Questionnaire Entities ---

class Questionnaire(Base):
    __tablename__ = "dq_questionnaire"
    id = Column(Integer, primary_key=True)
    code = Column(String(64), nullable=False, unique=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(String(20), nullable=False, default="active")  # active|inactive
    # Flag to mark the primary questionnaire (at most one should be true)
    is_primary = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    versions = relationship("QuestionnaireVersion", back_populates="questionnaire", cascade="all, delete-orphan")

    __table_args__ = (
        # Composite index to quickly find the active primary questionnaire
        Index("ix_dq_questionnaire_primary_active", is_primary, status),
    )

class QuestionnaireVersion(Base):
    __tablename__ = "dq_questionnaire_version"
    id = Column(Integer, primary_key=True)
    questionnaire_id = Column(Integer, ForeignKey("dq_questionnaire.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="draft")  # draft|published|archived
    valid_from = Column(DateTime)
    valid_to = Column(DateTime)
    metadata_json = Column(JSON)  # global metadata / hash, etc.
    created_at = Column(DateTime, server_default=func.now())
    created_by = Column(String(64))  # store code or username for now

    questionnaire = relationship("Questionnaire", back_populates="versions")
    sections = relationship("Section", back_populates="version", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("questionnaire_id", "version_number", name="uq_dq_questionnaire_version_number"),
        # Help locate latest published (filter by questionnaire_id + status, then sort by version_number)
        Index("ix_dq_qv_questionnaire_status_version", questionnaire_id, status, version_number),
    )

class Section(Base):
    __tablename__ = "dq_section"
    id = Column(Integer, primary_key=True)
    questionnaire_version_id = Column(Integer, ForeignKey("dq_questionnaire_version.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    order = Column(Integer, nullable=False)
    active_flag = Column(Boolean, nullable=False, default=True)

    version = relationship("QuestionnaireVersion", back_populates="sections")
    questions = relationship("Question", back_populates="section", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "dq_question"
    id = Column(Integer, primary_key=True)
    section_id = Column(Integer, ForeignKey("dq_section.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(64), nullable=False)
    text = Column(Text, nullable=False)
    type = Column(String(30), nullable=False, default="text")
    required = Column(Boolean, nullable=False, default=True)
    order = Column(Integer, nullable=False)
    validation_rules = Column(JSON)
    visible_if = Column(JSON)
    is_computed = Column(Boolean, nullable=False, default=False)
    computed_expression = Column(JSON)
    active_flag = Column(Boolean, nullable=False, default=True)

    section = relationship("Section", back_populates="questions")
    options = relationship("Option", back_populates="question", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("section_id", "code", name="uq_dq_question_code_per_section"),
    )

class Option(Base):
    __tablename__ = "dq_option"
    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey("dq_question.id", ondelete="CASCADE"), nullable=False, index=True)
    value = Column(String(128), nullable=False)
    label = Column(String(500), nullable=False)
    order = Column(Integer, nullable=False)
    is_other_flag = Column(Boolean, nullable=False, default=False)
    active_flag = Column(Boolean, nullable=False, default=True)

    question = relationship("Question", back_populates="options")

    __table_args__ = (
        UniqueConstraint("question_id", "value", name="uq_dq_option_value_per_question"),
    )

# --- Assignment & Responses ---

class QuestionnaireAssignment(Base):
    __tablename__ = "dq_assignment"
    id = Column(Integer, primary_key=True)
    user_code = Column(String(64), index=True)  # temporarily tie to codigo_estudiante
    questionnaire_version_id = Column(Integer, ForeignKey("dq_questionnaire_version.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="in_progress")  # in_progress|submitted|finalized|revoked
    assigned_at = Column(DateTime, server_default=func.now())
    last_activity_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    progress_percent = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        # Speed up lookups by (user_code, questionnaire_version_id)
        Index("ix_dq_assignment_user_version", user_code, questionnaire_version_id),
        Index("ix_dq_assignment_last_activity", last_activity_at),
    )

class Response(Base):
    __tablename__ = "dq_response"
    id = Column(Integer, primary_key=True)
    assignment_id = Column(Integer, ForeignKey("dq_assignment.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime, server_default=func.now())
    submitted_at = Column(DateTime)
    finalized_at = Column(DateTime)
    summary_cache = Column(JSON)

    __table_args__ = (
        Index("ix_dq_response_assignment", assignment_id),
    )

class ResponseItem(Base):
    __tablename__ = "dq_response_item"
    id = Column(Integer, primary_key=True)
    response_id = Column(Integer, ForeignKey("dq_response.id", ondelete="CASCADE"), nullable=False, index=True)
    # NOTE: Avoid ON DELETE CASCADE here to prevent multiple cascade paths in SQL Server.
    # Cleanup of orphaned items when deleting questions should be handled at application level.
    question_id = Column(Integer, ForeignKey("dq_question.id"), nullable=False, index=True)
    value = Column(String(2000))
    numeric_value = Column(Integer)
    extra_json = Column(JSON)
    answered_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("response_id", "question_id", name="uq_dq_response_question"),
        Index("ix_dq_response_item_response", response_id),
    )

# --- Change Log ---

class ChangeLog(Base):
    __tablename__ = "dq_change_log"
    id = Column(Integer, primary_key=True)
    entity_type = Column(String(40), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action = Column(String(40), nullable=False)
    before_json = Column(JSON)
    after_json = Column(JSON)
    actor = Column(String(64))
    created_at = Column(DateTime, server_default=func.now(), index=True)


# --- Minimal schema guard for incremental changes ---

def ensure_dynamic_schema(db_engine):
    """Ensure new columns exist without a full migration tool.

    Currently adds dq_questionnaire.is_primary if missing.
    Safe to run on startup; no-op if column already exists.
    """
    try:
        inspector = inspect(db_engine)
        cols = inspector.get_columns("dq_questionnaire")
        col_names = {c.get("name") or c.get("column_name") for c in cols}
        with db_engine.begin() as conn:
            if "is_primary" not in col_names:
                # SQL Server BIT type for boolean; default 0
                conn.execute(text("ALTER TABLE dq_questionnaire ADD is_primary BIT NOT NULL CONSTRAINT DF_dq_questionnaire_is_primary DEFAULT 0"))

            # Ensure performance indexes (SQL Server specific IF NOT EXISTS checks)
            conn.execute(text(
                """
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_dq_questionnaire_primary_active' AND object_id = OBJECT_ID('dbo.dq_questionnaire'))
                BEGIN
                    CREATE INDEX ix_dq_questionnaire_primary_active ON dbo.dq_questionnaire (is_primary, status);
                END
                """
            ))
            conn.execute(text(
                """
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_dq_qv_questionnaire_status_version' AND object_id = OBJECT_ID('dbo.dq_questionnaire_version'))
                BEGIN
                    CREATE INDEX ix_dq_qv_questionnaire_status_version ON dbo.dq_questionnaire_version (questionnaire_id, status, version_number);
                END
                """
            ))
            conn.execute(text(
                """
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_dq_assignment_user_version' AND object_id = OBJECT_ID('dbo.dq_assignment'))
                BEGIN
                    CREATE INDEX ix_dq_assignment_user_version ON dbo.dq_assignment (user_code, questionnaire_version_id);
                END
                """
            ))
            conn.execute(text(
                """
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_dq_assignment_last_activity' AND object_id = OBJECT_ID('dbo.dq_assignment'))
                BEGIN
                    CREATE INDEX ix_dq_assignment_last_activity ON dbo.dq_assignment (last_activity_at);
                END
                """
            ))
            conn.execute(text(
                """
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_dq_response_assignment' AND object_id = OBJECT_ID('dbo.dq_response'))
                BEGIN
                    CREATE INDEX ix_dq_response_assignment ON dbo.dq_response (assignment_id);
                END
                """
            ))
            conn.execute(text(
                """
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_dq_response_item_response' AND object_id = OBJECT_ID('dbo.dq_response_item'))
                BEGIN
                    CREATE INDEX ix_dq_response_item_response ON dbo.dq_response_item (response_id);
                END
                """
            ))
    except Exception:
        # Don't crash app if we can't alter schema; feature will behave as False
        pass

