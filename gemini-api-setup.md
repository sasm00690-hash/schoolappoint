# Sida loo helo Gemini API Key oo Bilaash ah (1 Daqiiqo gudaheed)

Nidaamkan AI-ga ee dugsiyada wuxuu ku shaqeynayaa Google Gemini. Google wuxuu ku siinayaa koodhka API-ga (API Key) oo bilaash ah oo aad ku tijaabin karto.

Raac tallaabooyinkan fudud si aad u hesho koodhkaaga:

---

### Tallaabada 1aad: Tag Google AI Studio
1. Fur browser-kaaga oo tag website-kaan: **[aistudio.google.com](https://aistudio.google.com)**.
2. Soo gal adigoo isticmaalaya Gmail-kaaga caadiga ah.

### Tallaabada 2aad: Abuur API Key
1. Dhanka bidix ee sare ee shaashadda, guji badhanka weyn ee ay ku qoran tahay **`Get API key`** (ama calaamadda furaha).
2. Guji badhanka buluugga ah ee **`Create API Key`**.
3. Dooro **`Create API key in new project`** (si uu kuugu abuuro mashruuc cusub oo bilaash ah).
4. Sug 5 ilbiriqsi ilaa uu koodhku ka diyaar noqdo.

### Tallaabada 3aad: Nuqul ka samey (Copy)
1. Marka koodhku kuu soo baxo (wuxuu ka bilaabmaa `AIzaSy...`), guji badhanka **`Copy`**.
2. Ku ilaali meel ammaan ah (sida Notepad).

---

### Sida loogu shubo n8n:
1. Fur n8n dashboard-kaaga, oo fur workflow-ga cusub ee Dugsiyada.
2. Raadi node-ka ay ku qoran tahay **`Gemini AI Agent`** (HTTP Request node).
3. Labo jeer guji si aad u furto.
4. Fiiri meesha ay ku qoran tahay **`URL`**:
   `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_GEMINI_API_KEY_HERE`
5. Tirtir qoraalka dambe ee ah `YOUR_GEMINI_API_KEY_HERE` kuna beddel **API Key-gaaga** aad hadda ka soo koobiyaysatay Google AI Studio.
6. Xir node-ka, ka dibna guji **Save** (sare midig).
