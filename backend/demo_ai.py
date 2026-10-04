"""Demo AI: rules ke result ko simple English mein samjhata hai.
Ye koi legal faisla nahi karta. Sab demo content hai, official sarkari data nahi."""

DOC_INFO = {
    "PAN Card": ("Permanent Account Number card of the business or owner.", "Use the company PAN for companies, owner PAN for proprietorships."),
    "Company PAN Card": ("PAN card issued in the name of the company.", "The name must match your registration certificate exactly."),
    "Aadhaar Card": ("Government ID of the owner or director.", "Upload a clear scan with all four corners visible."),
    "Address Proof": ("Proof of the business or site address, such as an electricity bill or rent agreement.", "The document should not be older than 3 months."),
    "Building Plan": ("Approved architectural drawing of the factory building.", "It should carry the stamp of the local authority."),
    "Fire Safety Plan": ("Drawing showing exits, extinguishers and fire fighting arrangements.", "Mark all emergency exits clearly."),
    "Land Ownership Proof": ("Sale deed, lease deed or allotment letter for the plot.", "Lease documents must show the remaining lease period."),
    "Site Plan": ("Map of the plot showing buildings, roads and boundaries.", "Include the plot number and scale."),
    "Process Flow Chart": ("Step-by-step diagram of how raw material becomes the product.", "Mention where waste or emissions are produced."),
    "Effluent Treatment Plan": ("Plan describing how liquid waste will be treated before disposal.", "Include the capacity of the treatment unit."),
    "Machinery List": ("List of machines with capacity and power rating.", "Add the total connected load in kW."),
    "Storage Layout Plan": ("Drawing of where hazardous material is stored on site.", "Show distances from buildings and boundaries."),
    "Material Safety Data Sheet": ("Safety information sheet for each hazardous material used.", "Get it from the material supplier."),
    "Qualified Person Certificate": ("Qualification proof of the technical person in charge.", "Pharmacy or relevant science degree is usually needed."),
    "Plant Layout Plan": ("Floor plan of the manufacturing area and departments.", "Show clean areas and storage separately."),
    "Bank Account Details": ("Cancelled cheque or bank statement of the business.", "Account name must match the business name."),
    "Employee List": ("List of employees with joining date and salary.", "Keep it in a simple table format."),
}

WHEN = {
    "FIRE": "Before construction is completed and before operations begin.",
    "MUNI_CONN": "During construction, so connections are ready by start of production.",
    "SPCB": "Before starting construction (Consent to Establish) and again before operations.",
    "FACT": "Before the factory starts running with workers.",
    "PESO": "Before storing or using any hazardous material on site.",
    "DRUG": "Before manufacturing begins.",
    "UDYAM": "As early as possible. It is quick and unlocks MSME benefits.",
    "LABOUR": "Within the first weeks after crossing 20 employees.",
    "TRADE": "Before opening the business to customers.",
}


def explain_document(name: str) -> dict:
    what, tip = DOC_INFO.get(name, ("Supporting document for this approval.", "Upload a clear, readable scan."))
    return {"name": name, "what": what, "tip": tip}


def personal_reason(code: str, b) -> str:
    """Aapke business ke data ke hisaab se 'kyun chahiye' ka jawab."""
    if code == "PESO":
        return "You told us your project uses hazardous material, so this license is needed."
    if code == "LABOUR":
        return f"Your team has {b.num_members} members, which is 20 or more."
    if code == "SPCB":
        return f"Your sector ({b.industry}) produces waste or emissions that must be regulated."
    if code == "FACT":
        return f"You are setting up a manufacturing unit with {b.num_members} team members."
    if code == "DRUG":
        return "Pharmaceutical manufacturing needs a state drug license."
    if code == "FIRE":
        return f"Every {b.project_size.split('(')[0].strip().lower()} industrial project needs fire safety clearance."
    return "This approval applies to every business in your category."


def how_steps(approval_name: str) -> list[str]:
    return [
        "Collect the documents listed below.",
        "Upload each one. AI checks that it is readable and correct.",
        "Fix anything flagged, then submit the application.",
        f"Track the status of {approval_name} on your dashboard.",
    ]


def build_summary(b, count: int, total_days: int, longest: str) -> str:
    return (
        f"Based on your profile ({b.business_type or 'business'}, {b.industry}, "
        f"{b.num_members} team members, Rs {b.investment_lakh} lakh investment), "
        f"you need {count} approvals. The longest one is {longest}. "
        f"Apply for several in parallel, so the whole process fits in about "
        f"{total_days} days instead of waiting for each one in turn."
    )