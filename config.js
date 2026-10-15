/* ---- GLGC Choirs config ----
   Two Google Forms feed this deck (LP Mrs Djabatey, 15 Oct 2026):
     SAT = "GLGC CHOIRS REHEARSAL & OUTREACH ATTENDANCE"
           Timestamp | Date | Choir | Governor | Total Number of Souls won on Outreach this Week | Rehearsal Attendance | Rehearsal Offering
     SUN = "GLGC CHOIRS SUNDAY ATTENDANCE"
           Timestamp | Date | Choir | Governor | Sunday Attendance | Number of New Members from Deep Sea Fishing today
   Each response sheet must be shared "Anyone with the link: Viewer". Put the spreadsheet id (the long code between
   /d/ and /edit in its link) in id, and the tab name in tab ('' = first tab). Both forms may share one spreadsheet.
   A report counts for the week ending the Sunday on/after its Date answer (timestamp if Date is blank); a later
   submission by the same governor in the same week replaces the earlier one.
   While both ids are empty the deck shows SAMPLE numbers with a banner. */
window.CH_CONFIG = {
  SAT: { id:'11lSkC4YpVbhK98FLjlWEATW6xhlxoyQzQkYaWhFroJc', tab:'' },
  SUN: { id:'1ufi1oYo8M6nnslbEA_m7zQgPGSdPh4m6AjJFQM9rabo', tab:'' }
   // no deadlines: the forms stay open and every submission counts, whenever it comes in
};
