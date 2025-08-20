---
layout: default
permalink: /climbs/
title: climbs
nav: true
# nav_order: 1
map: true
tabs: true
# pagination:
#   enabled: true
#   collection: posts
#   permalink: /page/:num/
#   per_page: 15
#   sort_field: date
#   sort_reverse: true
#   trail:
#     before: 1 # The number of links before the current page
#     after: 3 # The number of links after the current page
---
<div class="header-bar">
    <h1>Climbs</h1>
    <h2>A collection of all activities I do in the mountain</h2>
</div>

<div id="swiss-map" style="width:100%; height:600px; cursor:pointer;"></div>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/@mapbox/polyline@1.1.1/src/polyline.js"></script>

<script>
console.log("Full URL:", window.location.href);
console.log("Path:", window.location.pathname);
console.log("Folder:", window.location.href.replace(window.location.pathname, ""));
</script>

<script>
let map; // make map global so other functions can access it

let tableData = [];

fetch('../assets/json/table_data.json')
  .then(res => res.json())
  .then(json => {
    tableData = json.slice(1).filter(row => row[0]); // skip empty dates
    console.log("Table data loaded:", tableData);
  })
  .catch(err => console.error("Failed to load table_data.json:", err));

const typeColors = {
  "Hochtour": "purple",
  "Hike": "green",
  "Walk": "green",
  "Run": "green",
  "BackcountrySki": "blue",
  "AlpineSki": "blue",
  "Alpin Klettern": "red",
  "Sport kletten": "red",
  "Ride": "orange",
}

document.addEventListener("DOMContentLoaded", function() {
  const mapDiv = document.getElementById('swiss-map');
  
  map = L.map(mapDiv).setView([46.8182, 8.2275], 8);

  L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg', {
    attribution: '&copy; <a href="https://www.swisstopo.admin.ch/en/home.html">swisstopo</a>',
    maxZoom: 20
  }).addTo(map);

  // Only enter fullscreen on the first click
  let fullscreenEntered = false;
  mapDiv.addEventListener('click', () => {
    if (!fullscreenEntered && !document.fullscreenElement) {
      mapDiv.requestFullscreen().then(() => {
        map.invalidateSize();
        fullscreenEntered = true;
      });
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) fullscreenEntered = false;
  });

  // Fetch activities and plot them
  fetch('/activities.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log("Activities fetched successfully:", data);
    plotActivities(data);
  })
  .catch(error => {
    console.error("Failed to fetch activities.json:", error);
  });
});

function plotActivities(activities) {
    let allLatLngs = [];

    activities.forEach(activity => {
        if (!activity.map.summary_polyline) return;

        const latlngs = polyline.decode(activity.map.summary_polyline).map(([lat, lng]) => [lat, lng]);

        const color = getActivityColor(activity);

        L.polyline(latlngs, {
            color: color,
            weight: 5,
            opacity: 0.6
        }).addTo(map);

        allLatLngs = allLatLngs.concat(latlngs);
    });

    if (allLatLngs.length > 0) {
        map.fitBounds(allLatLngs);
    }
}

function formatActivityDate(isoString) {
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function getActivityColor(activity) {
  if (!activity.start_date || !activity.name) return "blue";

  const activityDate = formatActivityDate(activity.start_date);

  const match = tableData.find(row =>
    row[0] === activityDate// && row[1] === activity.name
  );

  if (match) {
    const type = match[2]; // type of activity
    return typeColors[type] || "blue";
  }

  return typeColors[activity.type] || "blue";
}
</script>

<div class="tabs-bar" style="text-align:center;">
    <h2>Activity type</h2>
</div>

{% tabs log %}

{% tab log all %}
test
<table id="tourTable">
  <thead>
    <tr>
      <th onclick="sortTable(0)">Date ⬍</th>
      <th onclick="sortTable(1)">Tour ⬍</th>
      <th onclick="sortTable(2)">Type ⬍</th>
      <th onclick="sortTable(3)">Difficulty ⬍</th>
    </tr>
  </thead>
  <tbody>
    <!-- Rows will be inserted here by JavaScript -->
  </tbody>
</table>

<script>
// Fetch the JSON file
fetch('../assets/json/table_data.json')
  .then(response => response.json())
  .then(data => {
    const tbody = document.querySelector("#tourTable tbody");
    
    // Skip the header row
    data.slice(1).forEach(row => {
      if (!row[0]) return;  // ignore entries with no date

      // First 3 columns
      const tr = document.createElement("tr");
      [0,1,2].forEach(i => {
        const td = document.createElement("td");
        td.textContent = row[i] || "";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);

      // 4th column: combine columns 6, 7, 8 (indices 5,6,7)
      const tdGrades = document.createElement("td");
      tdGrades.textContent = [row[4], row[5], row[6], row[7]].filter(Boolean).join(", ");
      tr.appendChild(tdGrades);

      tbody.appendChild(tr);
    });

    // Sorting function
    window.sortTable = function(colIndex) {
      const rows = Array.from(tbody.querySelectorAll("tr"));
      const sorted = rows.sort((a,b) => {
        const aText = a.cells[colIndex].textContent;
        const bText = b.cells[colIndex].textContent;
        return aText.localeCompare(bText, undefined, {numeric: true});
      });
      if (tbody.dataset.sortedCol == colIndex && tbody.dataset.sortDir == "asc") {
        sorted.reverse();
        tbody.dataset.sortDir = "desc";
      } else {
        tbody.dataset.sortDir = "asc";
      }
      tbody.dataset.sortedCol = colIndex;
      tbody.innerHTML = "";
      sorted.forEach(row => tbody.appendChild(row));
    }
  })
  .catch(err => console.error("Failed to load JSON:", err));
</script>


{% endtab %}

{% tab log hochtour %}

```javascript
console.log("hello");
```

{% endtab %}

{% tab log alpine climb %}

```javascript
pputs 'hello'
```

{% endtab %}

{% tab log skitour %}
test
<!-- ```php
var_dump('hello');
``` -->

{% endtab %}

{% tab log trailrun %}
test
<!-- ```php
var_dump('hello');
``` -->

{% endtab %}

{% tab log hike %}
test
<!-- ```php
var_dump('hello');
``` -->

{% endtab %}

{% endtabs %}
