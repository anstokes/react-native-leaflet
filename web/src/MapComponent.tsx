import React, { Component } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet/dist/images/layers-2x.png";
import "leaflet/dist/images/layers.png";
import "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import MapComponentView from "./MapComponent.view";
import L from "leaflet";
import mockMapLayers from "./testData/mockMapLayers";
import mockMapShapes from "./testData/mockMapShapes";
import mockMapMarkers from "./testData/mockMapMarkers";
import {
  WebViewLeafletEvents,
  MapEventMessage,
  MapLayer,
  MapMarker,
  MapShape,
  INFINITE_ANIMATION_ITERATIONS,
  AnimationType,
  WebviewLeafletMessagePayload
} from "./models";
import "./styles/markers.css";
import "./styles/markerAnimations.css";
import * as ReactLeaflet from "react-leaflet";
type LatLng = ReactLeaflet.LatLng;
type LatLngBounds = ReactLeaflet.LatLngBounds;

export const SHOW_DEBUG_INFORMATION = false;
const ENABLE_BROWSER_TESTING = false;

interface State {
  debugMessages: string[];
  isFromNative: boolean;
  isMobile: boolean;
  mapCenterPosition: LatLng;
  mapLayers: MapLayer[];
  mapMarkers: MapMarker[];
  mapShapes: MapShape[];
  ownPositionMarker: MapMarker;
  mapRef: any;
  zoom: number;
  autoZoom: boolean;
  useMarkerClustering: boolean;
  // Additional properties
  dragging: boolean;
  doubleClickZoom: boolean;
  scrollWheelZoom: boolean;
  touchZoom: boolean;
  zoomControl: boolean;
  // onMessageReceived
  onMessageReceived: any;
}

export default class MapComponent extends Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      debugMessages: ["test"],
      isFromNative: false,
      isMobile: null,
      mapCenterPosition: props.mapCenterPosition ?? { lat: 36.56, lng: -76.17 },
      mapLayers: props.mapLayers ?? [],
      mapMarkers: props.mapMarkers ?? [],
      mapShapes: props.mapShapes ?? [],
      mapRef: null,
      ownPositionMarker: null,
      zoom: props.zoom ?? 6,
	  // Additional properties; disabled by default
	  autoZoom: props.autoZoom ?? false,
	  useMarkerClustering: props.useMarkerClustering ?? false,
      // Additional properties; enabled by default
      dragging: props.dragging ?? true,
      doubleClickZoom: props.doubleClickZoom ?? true,
      scrollWheelZoom: props.scrollWheelZoom ?? true,
      touchZoom: props.touchZoom ?? true,
      zoomControl: props.zoomControl ?? true,
	  // onMessageReceived
	  onMessageReceived: props.onMessageReceived ?? null
    };
  }

  componentDidMount = () => {
    let DefaultIcon = L.icon({
      iconUrl: icon,
      shadowUrl: iconShadow
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    this.addEventListeners();
    this.sendMessage({
      msg: WebViewLeafletEvents.MAP_COMPONENT_MOUNTED
    });
    if (ENABLE_BROWSER_TESTING) {
      this.loadMockData();
    }
  };
  
  componentWillUnmount = () => {
    this.removeEventListeners();
  }

  componentDidUpdate = (prevProps: any, prevState: State) => {
    const { mapRef } = this.state;
    if (mapRef && !prevState.mapRef) {
      mapRef.current?.leafletElement.invalidateSize();
      this.sendMessage({
        msg: WebViewLeafletEvents.MAP_READY
      });
	  this.fitMapBounds();
    }
	if (this.props != prevProps) {
	  //console.log('Props changed; perhaps operating in React Native Web');
	  this.propsToState(prevProps);
	}
  };

  private addDebugMessage = (msg: any) => {
    if (typeof msg === "object") {
      //this.addDebugMessage("STRINGIFIED:");
      this.setState({ debugMessages: [...this.state.debugMessages, JSON.stringify(msg, null, 4)] });
    } else {
      this.setState({ debugMessages: [...this.state.debugMessages, msg] });
    }
  };

  private addEventListeners = () => {
    if (document) {
      document.addEventListener("message", this.handleMessage);
      this.addDebugMessage("set document listeners");
      this.sendMessage({
        msg: WebViewLeafletEvents.DOCUMENT_EVENT_LISTENER_ADDED
      });
    }
    if (window) {
      window.addEventListener("message", this.handleMessage);
      this.addDebugMessage("setting Window");
      this.sendMessage({
        msg: WebViewLeafletEvents.WINDOW_EVENT_LISTENER_ADDED
      });
    }
    if (!document && !window) {
      this.sendMessage({
        error: WebViewLeafletEvents.UNABLE_TO_ADD_EVENT_LISTENER
      });
      return;
    }
  };
  
  private removeEventListeners = () => {
    if (document) {
      document.removeEventListener("message", this.handleMessage);
    }
    if (window) {
      window.removeEventListener("message", this.handleMessage);
    }	
  };

  private handleMessage = (event: any & { data: State }) => {
    this.addDebugMessage(event.data);
    try {
      if (event.data.mapCenterPosition) {
        this.state.mapRef.leafletElement.flyTo([
          event.data.mapCenterPosition.lat,
          event.data.mapCenterPosition.lng
        ]);
      }
	  if (typeof event.data.zoomControl !== undefined) {
        if (event.data.zoomControl) {
		  this.state.mapRef.leafletElement.addControl( this.state.mapRef.leafletElement.zoomControl );
		} else {
		  this.state.mapRef.leafletElement.removeControl( this.state.mapRef.leafletElement.zoomControl );
		}
      }
      this.setState({ ...this.state, ...event.data }, this.fitMapBounds);
    } catch (error) {
      this.addDebugMessage({ error: JSON.stringify(error) });
    }
  };

  protected sendMessage = (message: MapEventMessage) => {
    // @ts-ignore
    if (window.ReactNativeWebView) {
      // @ts-ignore
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
      console.log("sendMessage  ", JSON.stringify(message));
    }
	if (typeof this.state.onMessageReceived === 'function') {
	  this.state.onMessageReceived(message);	
	}	
  };

  private loadMockData = () => {
    this.addDebugMessage("loading mock data");
    this.setState({
      mapLayers: mockMapLayers,
      mapMarkers: mockMapMarkers,
      mapShapes: mockMapShapes,
      ownPositionMarker: {
        id: "Own Position",
        position: { lat: 36.56, lng: -76.17 },
        icon: "❤️",
        size: [32, 32],
        animation: {
          duration: 1,
          delay: 0,
          iterationCount: INFINITE_ANIMATION_ITERATIONS,
          type: AnimationType.BOUNCE
        }
      }
    });
  };
  
  private propsToState = (prevProps: any) => {
	// List of properties which are transfered to state
	const currentProps = JSON.parse(JSON.stringify(this.props));
    const stateProps = ['mapCenterPosition', 'mapLayers', 'mapMarkers', 'mapShapes', 'zoom', 'autoZoom', 'useMarkerClustering', 'dragging', 'doubleClickZoom', 'scrollWheelZoom', 'touchZoom', 'zoomControl', 'onMessageReceived'];
	// Define new state
	var newState: { [key: string]: any } = {};
	for (var i in stateProps) {
	 var propName = stateProps[i];
	 // Check if propery has changed
	 if (currentProps[propName] != prevProps[propName]) {
	  // Apply change to state
	  newState[propName] = currentProps[propName];
	 }
	}
	
	// Save state and zoom to new bounds
	this.setState({...this.state, ...newState}, this.fitMapBounds);
  }	  
  
  private fitMapBounds = () => {
	const { autoZoom, mapMarkers, mapRef } = this.state;
	if ( autoZoom && mapMarkers && mapRef ) {
      const map = mapRef.leafletElement;

      // Loop through markers
	  const markersBounds:LatLngBounds = [mapMarkers[0].position];
	  mapMarkers.forEach((marker) => {
		  markersBounds.push(marker.position);
	  });
	  
	  // Fit the map with to the markers bounds
	  map.flyToBounds(markersBounds, this.state.autoZoom);
    }
  };

  private onMapEvent = (
    webViewLeafletEvent: WebViewLeafletEvents,
    payload?: WebviewLeafletMessagePayload
  ) => {
    if (!payload && this.state.mapRef?.leafletElement) {
      debugger;
      const mapCenterPosition: LatLng = {
        lat: this.state.mapRef.leafletElement?.getCenter().lat,
        lng: this.state.mapRef.leafletElement?.getCenter().lng
      };

      payload = {
        mapCenterPosition: mapCenterPosition,
        bounds: this.state.mapRef.leafletElement?.getBounds(),
        zoom: this.state.mapRef.leafletElement?.getZoom()
      };
    }
    this.sendMessage({ event: webViewLeafletEvent, payload });
  };

  private setMapRef = (mapRef: any) => {
    if (!this.state.mapRef) {
      this.setState({ mapRef });
    }
  };
  
  render() {
    const {
      debugMessages,
      mapCenterPosition,
      mapLayers,
      mapMarkers,
      mapShapes,
      ownPositionMarker,
      zoom,
	  autoZoom,
	  useMarkerClustering,
	  dragging,
	  doubleClickZoom,
	  scrollWheelZoom,
	  touchZoom,
	  zoomControl
    } = this.state;
    return (
      <MapComponentView
        addDebugMessage={this.addDebugMessage}
        debugMessages={debugMessages}
        mapCenterPosition={mapCenterPosition}
        mapLayers={mapLayers}
        mapMarkers={mapMarkers}
        mapShapes={mapShapes}
        onMapEvent={this.onMapEvent}
        ownPositionMarker={ownPositionMarker}
        setMapRef={this.setMapRef}
        zoom={zoom}
		dragging={dragging}
		doubleClickZoom={doubleClickZoom}
		scrollWheelZoom={scrollWheelZoom}
		touchZoom={touchZoom}
		zoomControl={zoomControl}
		useMarkerClustering={useMarkerClustering}
      />
    );
  }
}
