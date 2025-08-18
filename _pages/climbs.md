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
    <h2>A collection of all activities I do in the mountains</h2>
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

        L.polyline(latlngs, {
            color: 'blue',
            weight: 3,
            opacity: 0.6
        }).addTo(map);

        allLatLngs = allLatLngs.concat(latlngs);
    });

    if (allLatLngs.length > 0) {
        map.fitBounds(allLatLngs);
    }
}
</script>

<div class="tabs-bar" style="text-align:center;">
    <h2>Activity type</h2>
</div>

{% tabs log %}

{% tab log all %}
test
<table
  data-click-to-select="true"
  data-height="460"
  data-pagination="true"
  data-search="true"
  data-toggle="table"
  data-url="{{ '/assets/json/table_data.json' | relative_url }}">
  <thead>
    <tr>
      <th data-checkbox="true"></th>
      <th data-field="id" data-halign="left" data-align="center" data-sortable="true">ID</th>
      <th data-field="name" data-halign="center" data-align="right" data-sortable="true">Item Name</th>
      <th data-field="price" data-halign="right" data-align="left" data-sortable="true">Item Price</th>
    </tr>
  </thead>
</table>

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
