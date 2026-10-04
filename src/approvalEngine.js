// Industry ke hisaab se dynamic approvals aur documents generate karne ka AI engine
export function getIndustryChecklist(industryName) {
  const commonApprovals = [
    { id: 'fire', name: 'Fire Safety NOC', dept: 'Fire Department', sla: '7 Days', mandatory: true },
    { id: 'water', name: 'Water & Power Setup Connection', dept: 'Municipal Corp.', sla: '10 Days', mandatory: true },
  ];

  if (industryName.includes('Chemical') || industryName.includes('Manufacturing')) {
    return [
      ...commonApprovals,
      { id: 'pollution', name: 'State Pollution Control Board (SPCB) Consent', dept: 'Ministry of Environment', sla: '15 Days', mandatory: true },
      { id: 'factory', name: 'Factory License & Building Plan Approval', dept: 'Directorate of Factories', sla: '12 Days', mandatory: true },
      { id: 'explosive', name: 'Petroleum & Explosives Safety License (PESO)', dept: 'Central Safety Dept', sla: '20 Days', mandatory: true }
    ];
  } else if (industryName.includes('Pharma')) {
    return [
      ...commonApprovals,
      { id: 'pollution', name: 'Pollution Control Board Clearance', dept: 'Ministry of Environment', sla: '15 Days', mandatory: true },
      { id: 'drug', name: 'State FDA Manufacturing License', dept: 'Drug Control Department', sla: '25 Days', mandatory: true },
      { id: 'bio', name: 'Bio-Medical Waste Authorization', dept: 'Health Department', sla: '7 Days', mandatory: true }
    ];
  } else {
    // Default dynamic checklist for other industries
    return [
      ...commonApprovals,
      { id: 'trade', name: 'Municipal Trade License', dept: 'Local Municipal Body', sla: '5 Days', mandatory: true },
      { id: 'gst_msme', name: 'GST & MSME Udyam Registration Certificate', dept: 'Ministry of MSME', sla: 'Instant', mandatory: true }
    ];
  }
}