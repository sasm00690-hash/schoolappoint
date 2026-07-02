# SchoolAuto Pro: School Pre-Registration & Admission Booking System

Nidaamkan waa SaaS is-wada oo loogu talagalay **Diiwaangelinta Hore iyo Ballan Qabsashada Ardayda** (Pre-Registration & Appointment Booking). 

Waalidiinta cusub ee raba inay carruurta geeyaan dugsiga waxay buuxinayaan foomka ka hor inta aysan iman dugsiga. Nidaamku wuxuu xaqiijinayaa dugsiga, wuxuu diiwaangelinayaa ardayga, wuxuu u dirayaa email ogeysiis ah maamulaha dugsigaas, waalidkana wuxuu u tusayaa farriin xaqiijin ah oo wadata lambarka WhatsApp-ka ee maamulka dugsiga.

---

## 📂 File-ada ku jira Workspace-kaaga:

1. **[school-booking-workflow.json](file:///c:/Users/Said/Desktop/N8N/school-booking-workflow.json)**: Waa workflow-ga rasmiga ah ee n8n ee diiwaangelinta hore iyo ballan qabsashada.
2. **[school-database-setup.md](file:///c:/Users/Said/Desktop/N8N/school-database-setup.md)**: Sida loo qaabeynayo Google Sheets (2 Tabs oo kaliya).

---

## 🛠️ Habka loo Setup gareeyo (Tallaabo-Tallaabo)

### Tallaabada 1aad: Diyaari Google Sheets-kaaga
1. Fur Google Sheet-kaaga gaarka ah ee ah: **[1uGRu30EIfFeRTSG-TG5lVj2QATA7yRFw5x1YBtoVev0](https://docs.google.com/spreadsheets/d/1uGRu30EIfFeRTSG-TG5lVj2QATA7yRFw5x1YBtoVev0)**.
2. Hubi inaad leedahay **2 tabs** oo keliya oo magacyadoodu yihiin **`Schools_Register`** iyo **`School_Leads`** sida ku qoran **[school-database-setup.md](file:///c:/Users/Said/Desktop/N8N/school-database-setup.md)**.
3. Ku shub xogtaada dhabta ah safka 2aad ee `Schools_Register`.

### Tallaabada 2aad: Ku shub Workflow-ga n8n
1. Tirtir wixii nodes ah ee ku jira canvas-kaaga n8n (**`Ctrl + A`** ka dibna **`Delete`**).
2. Koobi gareey dhammaan qoraalka JSON-ka ee ku jira **[school-booking-workflow.json](file:///c:/Users/Said/Desktop/N8N/school-booking-workflow.json)**.
3. Ku dheji n8n canvas-ka maran adigoo riixaya **`Ctrl + V`**.
4. Guji badhanka **`Save`** (ee sare midig).

### Tallaabada 3aad: Ku xir Gmail Node-ka (Notify Principal)
1. Labo jeer guji node-ka **`Notify Principal`** (gudaha n8n).
2. Ku xir koontadaada Gmail (Gmail OAuth2) si uu email-ku u diro ogeysiisyada dhabta ah.
3. Guji **`Save`**.

---

## 🧪 Sida loo tijaabiyo (Testing the System)

1. Guji badhanka **`Publish`** ee sare midig ee n8n (si uu workflow-gu u shaqeeyo Live).
2. Labo jeer guji node-ka koowaad ee **`n8n Form Trigger`**.
3. Ka koobi gareey **`Production URL`** (Foomka) kuna dheji tab cusub oo browser-kaaga ah.
4. Buuxi foomka:
   * **School ID**: Geli koodhkii dugsigaaga (tusaale: `SCH-AL-NUUR`).
   * **Parent Name**: Magacaaga.
   * **Student Name**: Magac arday.
   * **Preferred Meeting Date**: Sabti, 10:00 AM.
5. Taabo **Submit**.
6. **Hubi Google Sheet-kaaga**: Tab-ka `School_Leads` waxaad ku arki doontaa xogta ardayga iyo taariikhda ballanta oo si dhab ah ugu qoran!
7. **Hubi Gmail-kaaga**: Waxaad heli doontaa email kuu sheegaya in waalid cusub uu ballan qabsaday!
8. **Shaashadda Waalidka**: Foomka wuxuu waalidka u tusayaa farriin oranaysa: *"Ballantaada waa la xaqiijiyay... WhatsApp-ka dugsiga waa +252615000000..."*

---
*System Developed by: Adnan's Automation Agency*
