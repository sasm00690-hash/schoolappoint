# School Database Setup Guide (Booking System with Capacity Limit)

Fadlan fur Google Sheet-kaaga: **[1uGRu30EIfFeRTSG-TG5lVj2QATA7yRFw5x1YBtoVev0](https://docs.google.com/spreadsheets/d/1uGRu30EIfFeRTSG-TG5lVj2QATA7yRFw5x1YBtoVev0)**. 

Waxaan u baahanahay **2 Tabs (Sheets)** oo kaliya. Raac tilmaamahan hoos ku qoran si aad u qaabeyso:

---

## 1. Tab-ka 1aad: Magacow `Schools_Register`
Guji calaamadda **`+`** ee hoose ee Google Sheet si aad u abuurto tab cusub, magaceedana ka dhig **`Schools_Register`**. 

Ku shub xogtani safka koowaad iyo labaad:

| SchoolID | SchoolName | PrincipalEmail | WhatsAppNumber | MaxCapacity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SCH-AL-NUUR** | Al-Nuur School | principal.alnuur@example.com | +252615000000 | **5** | **Active** |
| **SCH-SOM-02** | Somali School | principal.som@example.com | +252616000000 | **50** | **Active** |
| **SCH-TEST-03** | Inactive School | principal.test@example.com | +252617000000 | **10** | **Inactive** |

*   **MaxCapacity**: Waa inta arday ugu badan ee dugsigaas uu iska diiwaangelin karo foomka. Haddii xogta `School_Leads` ay gaarto xaddigaas (Tusaale: **5** oo loogu talagalay Al-Nuur School), foomku si toos ah ayuu u xirmayaa!
*   **Diiwaangelinta Gacanta**: Dugsigu haddii uu rabo inuu gacanta ku ku daro arday ku qor kaliya saf cusub tab-ka `School_Leads`. n8n wuu xisaabin doonaa taas si uu u xiro system-ka marka la gaaro MaxCapacity!

---

## 2. Tab-ka 2aad: Magacow `School_Leads`
Abuur tab-ka 2aad oo magaceeda ka dhig **`School_Leads`**. Kan waa midka ardayda cusub lagu keydinayo ee qaabilsan ballamaha:

| SchoolID | ParentName | ParentPhone | StudentName | StudentGrade | MeetingDate | DateCreated | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

*(Safka koowaad oo kaliya ku qor tiirarkaan sare ku qoran, safafka hoosena u daa maran).*
