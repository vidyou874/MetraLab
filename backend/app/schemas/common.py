from enum import StrEnum


class UserRole(StrEnum):
    TECHNICIAN = "Technician"
    REVIEWER = "Reviewer"
    ADMINISTRATOR = "Administrator"
    AUDITOR = "Auditor"


class ReportStatus(StrEnum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    RETURNED = "Returned"
    REJECTED = "Rejected"
    FINALIZED = "Finalized"


class ResultDisposition(StrEnum):
    PASS = "Pass"
    FAIL = "Fail"
    WARNING = "Warning"
    NOT_EVALUATED = "Not evaluated"
    INCOMPLETE = "Incomplete"
