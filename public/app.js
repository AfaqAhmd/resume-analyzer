
async function signup(e) {

    try {


        e.preventDefault();

        let firstName = document.getElementById("firstName").value
        let lastName = document.getElementById("lastName").value
        let email = document.getElementById("email").value
        let password = document.getElementById("password").value
        let role = document.getElementById("role").value


        if (firstName === "" || lastName === "" || email === "" || password === "") {

            alert('Please fill all fields!');
            return;
        }


        if (role === "admin") {

            console.log("Admin selected");

        } else if (role === "user") {

            console.log("User selected");

        } else {

            alert('Please select user role')
            return

        };


        const res = await axios.post('http://localhost:5000/api/signUp',

            { firstName, lastName, email, password, role }

        )



        const data = res.data;
        console.log(res);


        if (data.status === 200) {

            alert(data.message);
            window.location.href = 'login.html';
            return;
        }


    } catch (err) {

        console.error(err);
        alert('⚠️ Server error or connection issue.');
    }

}

async function login(e) {

    e.preventDefault();

    let email = document.getElementById("email").value
    let password = document.getElementById("password").value


    if (email === "" || password === "") {

        alert('Please fill all fields!');
        return;
    }


    try {

        const res = await axios.post('http://localhost:5000/api/login',

            { email, password },
        );

        console.log(res.data.user.role);

        const token = res.data.token;  // JWT from backend
        localStorage.setItem("token", token);

        alert(res.data.message);  // success

         // Save the email in localStorage to use later (in user.html)
        localStorage.setItem("userEmail", email);

        getToken()


        // if (res.data.user.role === "user") {

        //     window.location.href = "user.html";
        // }
        // else if (res.data.user.role === "admin") {

        //     window.location.href = "admin.html";
        // }



    } catch (err) {

        if (err.response) {
            // backend responded with non-2xx
            alert(`Error: ${err.response.data.message}`);
        } else if (err.request) {
            // request made but no response
            alert("⚠️ No response from server. Possible CORS or network issue.");
        } else {
            alert("⚠️ Axios Error: " + err.message);
        }
        console.error(err);
    }



    
}




async function getToken() {

    const token = localStorage.getItem("token");

    const res = await axios.get("http://localhost:5000/api/home", {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });

    console.log(res.data.user);

    if (res.data.user.role === "user") {

        window.location.href = "user.html";
    }
    else if (res.data.user.role === "admin") {

        window.location.href = "admin.html";
    }



}

// async function submit(e) {

//     e.preventDefault();

// }

function login_page() {

    window.location.href = 'login.html'

}

function SignUp_page() {

    window.location.href = 'index.html'

}



/* =========================
   USER DASHBOARD LOGIC
========================= */


// Helper to render job analysis result (useable for old + new)
function renderJobAnalysisResult(container, ai) {
  if (!ai) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <h3>Last Job Match Result</h3>
    <p><strong>Match Score:</strong> ${ai.matchScore ?? 0}/100</p>
    <p><strong>Summary:</strong> ${ai.summary || "No summary available."}</p>

    <p><strong>Missing Skills:</strong></p>
    <ul>
      ${(ai.missingSkills || [])
        .map((s) => `<li>${s}</li>`)
        .join("")}
    </ul>

    <p><strong>Recommended Keywords:</strong></p>
    <ul>
      ${(ai.recommendedKeywords || [])
        .map((k) => `<li>${k}</li>`)
        .join("")}
    </ul>
  `;
}

// Check if resume already exists in DB and toggle UI accordingly
async function checkIfResumeUploaded(email) {
  const uploadSection = document.getElementById("upload-section");
  const uploadedSection = document.getElementById("uploadedResumeSection");
  const analyzeSection = document.getElementById("analyze-section");
  const resumeMeta = document.getElementById("resumeMeta");
  const jobMatchResult = document.getElementById("jobMatchResult");

  if (!uploadSection || !uploadedSection || !analyzeSection) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/resume/status?email=${encodeURIComponent(email)}`
    );
    const data = await res.json();

    if (res.status === 404 || data.hasResume === false) {
      // No resume yet
      uploadSection.style.display = "block";
      uploadedSection.style.display = "none";
      analyzeSection.style.display = "none";
      if (jobMatchResult) jobMatchResult.innerHTML = "";
      return;
    }

    if (!res.ok) {
      console.error("Status error:", data);
      return;
    }

    // Resume exists
    uploadSection.style.display = "none";
    uploadedSection.style.display = "block";
    analyzeSection.style.display = "block";

    if (resumeMeta) {
      const updated = data.updatedAt
        ? new Date(data.updatedAt).toLocaleString()
        : "N/A";
      resumeMeta.textContent = `Resume last updated: ${updated}`;
    }

    // If last analysis available, render it
    if (jobMatchResult && data.lastMatchScore) {
      const aiView = {
        matchScore: data.lastMatchScore,
        missingSkills: data.lastMissingSkills || [],
        recommendedKeywords: data.lastRecommendedKeywords || [],
        summary: data.lastSummary || "",
      };
      renderJobAnalysisResult(jobMatchResult, aiView);
    }
  } catch (err) {
    console.error("checkIfResumeUploaded error:", err);
  }
}

// On user.html load
window.addEventListener("load", () => {
  const loggedInUserEmail = localStorage.getItem("userEmail");

  const emailSpan = document.getElementById("user-email");
  const resumeEmailInput = document.getElementById("resumeEmail");
  const jobEmailInput = document.getElementById("jobEmail");

  if (loggedInUserEmail) {
    if (emailSpan) emailSpan.innerText = loggedInUserEmail;
    if (resumeEmailInput) resumeEmailInput.value = loggedInUserEmail;
    if (jobEmailInput) jobEmailInput.value = loggedInUserEmail;

    checkIfResumeUploaded(loggedInUserEmail);
  }

  // Update / Replace resume link
  const updateLink = document.getElementById("updateResumeLink");
  if (updateLink) {
    updateLink.addEventListener("click", (e) => {
      e.preventDefault();
      const uploadSection = document.getElementById("upload-section");
      if (uploadSection) uploadSection.style.display = "block";
    });
  }
});



/* =========================
   RESUME PDF UPLOAD HANDLER
========================= */

const uploadResumeForm = document.getElementById("uploadResumeForm");

if (uploadResumeForm) {
  uploadResumeForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const emailInput = document.getElementById("resumeEmail").value;
    const fileInput = document.getElementById("resumePdf").files[0];
    const resultMessage = document.getElementById("uploadStatusMessage");
    const submitBtn = this.querySelector('button[type="submit"]');

    if (!fileInput) {
      alert("Please select a PDF file");
      return;
    }

    const formData = new FormData();
    formData.append("email", emailInput);
    formData.append("resumePdf", fileInput);

    runWithLoader(async () => {
      const res = await fetch(`http://localhost:5000/api/resume/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        resultMessage.textContent = "Resume uploaded successfully!";
        document.getElementById("upload-section").style.display = "none";
        document.getElementById("uploadedResumeSection").style.display = "block";
        document.getElementById("analyze-section").style.display = "block";
      } else {
        alert(data.message || "Error uploading resume");
        console.error("Resume upload error:", data);
      }
    }, { button: submitBtn, loadingText: "Uploading..." });
  });
}


/* =========================
   JOB vs RESUME MATCH HANDLER
========================= */

const jobMatchForm = document.getElementById("jobMatchForm");

if (jobMatchForm) {
  jobMatchForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("jobEmail").value;
    const jobDescription = document.getElementById("jobDescription").value;
    const company = document.getElementById("company").value;
    const position = document.getElementById("position").value;
    const resultBox = document.getElementById("jobMatchResult");
    const submitBtn = this.querySelector('button[type="submit"]');

    if (!email || !jobDescription || !company || !position) {
      alert("Please fill all the fields!");
      return;
    }

    runWithLoader(async () => {
      const res = await fetch(`http://localhost:5000/api/resume/analyze-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          jobDescription,
          company,
          position,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Error analyzing job fit");
        console.error("Job match error:", data);
        return;
      }

      const { ai } = data;

      resultBox.innerHTML = `
        <h3>Job Match Result</h3>
        <p><strong>Match Score:</strong> ${ai.matchScore}/100</p>
        <p><strong>Summary:</strong> ${ai.summary}</p>
        <p><strong>Missing Skills:</strong></p>
        <ul>
          ${ai.missingSkills.map((s) => `<li>${s}</li>`).join("")}
        </ul>
        <p><strong>Recommended Keywords:</strong></p>
        <ul>
          ${ai.recommendedKeywords.map((k) => `<li>${k}</li>`).join("")}
        </ul>
      `;
    }, { button: submitBtn, loadingText: "Analyzing..." });
  });
}





function showLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "flex";
}

function hideLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "none";
}

/**
 * Generic helper:
 * - loader show
 * - optional button disable + text change
 * - async code run
 * - loader hide
 */
async function runWithLoader(asyncCallback, options = {}) {
  const { button, loadingText } = options;
  const originalText = button ? button.textContent : null;

  try {
    showLoader();

    if (button) {
      button.disabled = true;
      if (loadingText) button.textContent = loadingText;
    }

    return await asyncCallback();
  } finally {
    hideLoader();

    if (button) {
      button.disabled = false;
      if (originalText !== null) {
        button.textContent = originalText;
      }
    }
  }
}
