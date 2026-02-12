document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to show a temporary message
  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml =
          details.participants.length > 0
            ? details.participants
                .map((email) =>
                  `<li><span class="participant-email">${email}</span><button type="button" class="participant-remove" data-activity="${name}" data-email="${email}" aria-label="Remove ${email}">🗑</button></li>`
                )
                .join("")
            : '<li class="no-participants">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Current Participants (${details.participants.length}/${details.max_participants}):</strong>
            <ul class="participants-list">
              ${participantsHtml}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Event delegation for remove buttons
  activitiesList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".participant-remove");
    if (!btn) return;

    const activityName = btn.dataset.activity;
    const email = btn.dataset.email;

    if (!confirm(`Remove ${email} from ${activityName}?`)) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await resp.json();
      if (resp.ok) {
        showMessage(result.message || `Removed ${email}` , "success");
        fetchActivities();
      } else {
        showMessage(result.detail || "Failed to remove participant", "error");
      }
    } catch (err) {
      console.error("Error removing participant:", err);
      showMessage("Failed to remove participant. Try again.", "error");
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        // Refresh activities to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      showMessage("Failed to sign up. Please try again.", "error");
    }
  });

  // Initialize app
  fetchActivities();
});