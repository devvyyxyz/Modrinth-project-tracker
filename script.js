let currentPage = 0; // Track the current page
const versionsPerPage = 5; // Number of versions per page

async function fetchProjectStats() {
  const projectID = document.getElementById('projectID').value;
  if (!projectID) {
    alert('Please enter a Modrinth project ID.');
    return;
  }

  try {
    const response = await fetch(`https://api.modrinth.com/v2/project/${projectID}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    displayProjectStats(data);
    fetchVersionHistory(projectID);
    createDownloadChart(data.downloads); // Create download chart
  } catch (error) {
    document.getElementById('projectStats').innerHTML = `<p>${error.message}</p>`;
  }
}

function displayProjectStats(data) {
  const { title, description, downloads, followers, versions } = data;
  document.getElementById('projectStats').innerHTML = `
    <h2>${title}</h2>
    <p><strong>Description:</strong> ${description}</p>
    <p><strong>Downloads:</strong> ${downloads}</p>
    <p><strong>Followers:</strong> ${followers}</p>
    <p><strong>Latest Version:</strong> ${versions[0].version_number}</p>
  `;
}

async function fetchVersionHistory(projectID) {
  try {
    const response = await fetch(`https://api.modrinth.com/v2/project/${projectID}/version`);
    const versions = await response.json();

    // Store versions globally for pagination
    window.projectVersions = versions;

    // Display the first page of versions
    displayVersionsPage(currentPage);

    // Enable/disable pagination buttons based on version count
    document.getElementById('nextBtn').disabled = versions.length <= versionsPerPage;
    document.getElementById('prevBtn').disabled = true;
  } catch (error) {
    console.error('Error fetching version history:', error);
  }
}

function displayVersionsPage(page) {
  const start = page * versionsPerPage;
  const end = start + versionsPerPage;
  const versions = window.projectVersions.slice(start, end);

  const versionHistory = versions.map(v => `
    <p><strong>${v.version_number}</strong> - ${v.game_versions.join(", ")} - ${v.file_size} bytes</p>
  `).join('');

  document.getElementById('versionHistory').innerHTML = `
    <h3>Version History</h3>
    ${versionHistory}
  `;

  // Calculate and display update frequency
  const updateDates = versions.map(v => new Date(v.date_published));
  const avgFrequency = calculateUpdateFrequency(updateDates);
  document.getElementById('projectStats').innerHTML += `
    <p><strong>Average Update Frequency:</strong> ${avgFrequency} days</p>
  `;
}

function nextPage() {
  if ((currentPage + 1) * versionsPerPage < window.projectVersions.length) {
    currentPage++;
    displayVersionsPage(currentPage);
    document.getElementById('prevBtn').disabled = false;
  }

  if ((currentPage + 1) * versionsPerPage >= window.projectVersions.length) {
    document.getElementById('nextBtn').disabled = true;
  }
}

function previousPage() {
  if (currentPage > 0) {
    currentPage--;
    displayVersionsPage(currentPage);
    document.getElementById('nextBtn').disabled = false;
  }

  if (currentPage === 0) {
    document.getElementById('prevBtn').disabled = true;
  }
}

function calculateUpdateFrequency(dates) {
  if (dates.length < 2) return "N/A";
  dates.sort((a, b) => a - b);

  let totalDays = 0;
  for (let i = 1; i < dates.length; i++) {
    const daysDiff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
    totalDays += daysDiff;
  }
  return Math.round(totalDays / (dates.length - 1));
}

function createDownloadChart(downloadCount) {
  const ctx = document.getElementById('downloadChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Downloads'],
      datasets: [{
        label: 'Total Downloads',
        data: [downloadCount],
        backgroundColor: '#1DB954',
        borderColor: '#1ed760',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
