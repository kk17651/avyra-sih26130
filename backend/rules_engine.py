import re

from sqlalchemy.orm import Session

import models

NUMBER_RULE = re.compile(r"^(>=|<=|==|>|<)\s*(\d+)$")


def rule_matches(rule: models.ApprovalRule, business: models.Business) -> bool:
    if rule.field == "*":
        return True

    value = getattr(business, rule.field, None)
    if value is None:
        return False

    match = rule.match.strip()

    # Number wale rules: ">=20", "<5" jaise
    m = NUMBER_RULE.match(match)
    if m:
        try:
            number = float(value)
        except (TypeError, ValueError):
            return False
        op, limit = m.group(1), float(m.group(2))
        if op == ">=":
            return number >= limit
        if op == "<=":
            return number <= limit
        if op == ">":
            return number > limit
        if op == "<":
            return number < limit
        return number == limit

    # Text wale rules: value mein match hona chahiye
    return match.lower() in str(value).lower()


def discover_approvals(db: Session, business: models.Business) -> list[models.Approval]:
    """Rules decide: kaun se approvals is business ko chahiye."""
    result = []
    for approval in db.query(models.Approval).order_by(models.Approval.id).all():
        if any(rule_matches(r, business) for r in approval.rules):
            result.append(approval)
    return result