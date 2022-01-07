## ReactNative Leaflet
A WebView-based Leaflet Component for ReactNative, derived from [https://github.com/reggie3/react-native-webview-leaflet](https://github.com/reggie3/react-native-webview-leaflet).

### Background
[Leaflet](https://leafletjs.com/) was already being used, in association with [OpenStreetMap](https://www.openstreetmap.org), to provide real-time tracking of assets in a browser based back-office solution.  It became necessary to show this real-time tracking information to the customer/consumer (in an existing ReactNative mobile application) but the existing Leaflet Component did not support all the required functionality.

### Usage
Import:
```javascript
import ReactNativeLeaflet from "react-native-leaflet";
```

Typical Usage:
```javascript
<ReactNativeLeaflet
  ref={component => (this.webViewLeaflet = component)}
  /* Additional properties; see below */
/>
```

### Properties
| property            | required | type                            | purpose                                                                                                                                                                                                         |
| ------------------- | -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| backgroundColor     | optional | string                          | Color seen prior to the map loading                                                                                                                                                                             |
| doShowDebugMessages | optional | boolean                         | show debug information from the component containing the Leaflet map                                                                                                                                            |
| loadingIndicator    | optional | React.ReactElement              | custom component displayed while the map is loading                                                                                                                                                             |
| onError             | optional | function                        | Will receive an error event                                                                                                                                                                                     |
| onLoadEnd           | optional | function                        | Called when map stops loading                                                                                                                                                                                   |
| onLoadStart         | optional | function                        | Called when the map starts to load                                                                                                                                                                              |
| onMessageReceived   | required | function                        | This function receives messages in the form of a WebViewLeafletMessage object from the map                                                                                                                      |
| mapLayers           | optional | MapLayer array                  | An array of map layers                                                                                                                                                                                          |
| mapMarkers          | optional | MapMarker array                 | An array of map markers                                                                                                                                                                                         |
| mapShapes           | optional | MapShape[]                      | An array of map shapes                                                                                                                                                                                          |
| mapCenterPosition   | optional | {lat: [Lat], lng: [Lng]} object | The center position of the map. This coordinate will not be accurate if the map has been moved manually. However, calling the map's setMapCenterPosition function will cause the map to revert to this location |
| ownPositionMarker   | optional | Marker                          | A special marker that has an ID of OWN_POSTION_MARKER_ID                                                                                                                                                        |  |
| zoom                | optional | number                          | Desired zoom value of the map                                                                                                                                                                                   |