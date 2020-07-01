import * as React from "react";
import { WebView } from "react-native-webview";
import AssetUtils from "expo-asset-utils";
import { Asset } from "expo-asset";
import WebViewLeafletView from "./WebViewLeaflet.view";
import {
  MapMarker,
  WebviewLeafletMessage,
  MapStartupMessage,
  WebViewLeafletEvents,
  MapLayer,
  MapShape,
  OwnPositionMarker,
  OWN_POSTION_MARKER_ID
} from "./models";
import { ActivityOverlay } from "./ActivityOverlay";
import * as FileSystem from "expo-file-system";
import { LatLng } from "react-leaflet";
import isEqual from "lodash.isequal";
// @ts-ignore node types
const INDEX_FILE_PATH = require(`./assets/index.html`);

export interface WebViewLeafletProps {
  backgroundColor?: string;
  doShowDebugMessages?: boolean;
  loadingIndicator?: () => React.ReactElement;
  onError?: (syntheticEvent: any) => void;
  onLoadEnd?: () => void;
  onLoadStart?: () => void;
  onMessageReceived: (message: WebviewLeafletMessage) => void;
  mapLayers?: MapLayer[];
  mapMarkers?: MapMarker[];
  mapShapes?: MapShape[];
  mapCenterPosition?: LatLng;
  ownPositionMarker?: OwnPositionMarker;
  zoom?: number;
  autoZoom?: any;
  useMarkerClustering?: boolean;
  dragging?: boolean;
  doubleClickZoom?: boolean;
  scrollWheelZoom?: boolean;
  touchZoom?: boolean;
  zoomControl?: boolean;  
}

interface State {
  debugMessages: string[];
  mapCurrentCenterPosition: LatLng;
  webviewContent: string;
  isLoading: boolean;
}

class WebViewLeaflet extends React.Component<WebViewLeafletProps, State> {
  private webViewRef: any;
  static defaultProps = {
    backgroundColor: "#FAEBD7",
    doDisplayCenteringButton: true,
    doShowDebugMessages: false,
    loadingIndicator: () => {
      return <ActivityOverlay />;
    },
    onError: (syntheticEvent: any) => {},
    onLoadEnd: () => {},
    onLoadStart: () => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      debugMessages: [],
      isLoading: null,
      mapCurrentCenterPosition: null,
      webviewContent: null
    };
    this.webViewRef = null;
  }

  componentDidMount = () => {
    this.loadHTMLFile();
  };

  private loadHTMLFile = async () => {
    try {
      let asset: Asset = await AssetUtils.resolveAsync(INDEX_FILE_PATH);
      let fileString: string = await FileSystem.readAsStringAsync(
        asset.localUri
      );

      this.setState({ webviewContent: fileString });
    } catch (error) {
      console.warn(error);
      console.warn("Unable to resolve index file");
    }
  };

  componentDidUpdate = (prevProps: WebViewLeafletProps, prevState: State) => {
    const { webviewContent } = this.state;
    const {
      mapCenterPosition,
      mapMarkers,
      mapLayers,
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
    } = this.props;

    if (!prevState.webviewContent && webviewContent) {
      this.updateDebugMessages("file loaded");
    }
    if (!isEqual(mapCenterPosition, prevProps.mapCenterPosition)) {
      this.sendMessage({ mapCenterPosition });
    }
    if (!isEqual(mapMarkers, prevProps.mapMarkers)) {
      this.sendMessage({ mapMarkers });
    }
    if (!isEqual(mapLayers, prevProps.mapLayers)) {
      this.sendMessage({ mapLayers });
    }
    if (!isEqual(mapShapes, prevProps.mapShapes)) {
      this.sendMessage({ mapShapes });
    }
    if (!isEqual(ownPositionMarker, prevProps.ownPositionMarker)) {
      this.sendMessage({ ownPositionMarker });
    }
    if (zoom !== prevProps.zoom) {
      this.sendMessage({ zoom });
    }
	if (!isEqual(autoZoom, prevProps.autoZoom)) {
	  this.sendMessage({ autoZoom });
	}
	if (useMarkerClustering !== prevProps.useMarkerClustering) {
	  this.sendMessage({ useMarkerClustering });	
	}
    if (dragging !== prevProps.dragging) {
      this.sendMessage({ dragging });
    }
    if (doubleClickZoom !== prevProps.doubleClickZoom) {
      this.sendMessage({ doubleClickZoom });
    }
    if (scrollWheelZoom !== prevProps.scrollWheelZoom) {
      this.sendMessage({ scrollWheelZoom });
    }
    if (touchZoom !== prevProps.touchZoom) {
      this.sendMessage({ touchZoom });
    }
    if (zoomControl !== prevProps.zoomControl) {
      this.sendMessage({ zoomControl });
    }	
  };

  private setMapCenterPosition = () => {
    const { mapCurrentCenterPosition } = this.state;
    const { mapCenterPosition } = this.props;

    if (!isEqual(mapCenterPosition, mapCurrentCenterPosition)) {
      this.setState({
        mapCurrentCenterPosition: mapCenterPosition
      });
      this.sendMessage({
        mapCenterPosition
      });
    }
  };

  // Handle messages received from webview contents
  private handleMessage = (data: string) => {
    const { onMessageReceived } = this.props;

    let message: WebviewLeafletMessage = JSON.parse(data);
    this.updateDebugMessages(`received: ${JSON.stringify(message)}`);
    if (message.msg === WebViewLeafletEvents.MAP_READY) {
      this.sendStartupMessage();
    }
    if (message.event === WebViewLeafletEvents.ON_MOVE_END) {
      this.setState({
        mapCurrentCenterPosition: message.payload.mapCenterPosition
      });
    }
    onMessageReceived(message);
  };

  // Send message to webview
  private sendMessage = (payload: object) => {
    this.updateDebugMessages(`sending: ${payload}`);

    this.webViewRef?.injectJavaScript(
      `window.postMessage(${JSON.stringify(payload)}, '*');`
    );
  };

  // Send a startup message with initalizing values to the map
  private sendStartupMessage = () => {
    let startupMessage: MapStartupMessage = {};
    const {
      mapLayers,
      mapMarkers,
      mapShapes,
      mapCenterPosition,
      ownPositionMarker,
      zoom = 7,
	  autoZoom,
	  useMarkerClustering,
	  dragging,
	  doubleClickZoom,
	  scrollWheelZoom,
	  touchZoom,
	  zoomControl	  
    } = this.props;
    if (mapLayers) {
      startupMessage.mapLayers = mapLayers;
    }
    if (mapMarkers) {
      startupMessage.mapMarkers = mapMarkers;
    }
    if (mapCenterPosition) {
      startupMessage.mapCenterPosition = mapCenterPosition;
    }
    if (mapShapes) {
      startupMessage.mapShapes = mapShapes;
    }
    if (ownPositionMarker) {
      startupMessage.ownPositionMarker = {
        ...ownPositionMarker,
        id: OWN_POSTION_MARKER_ID
      };
    }

    startupMessage.zoom = zoom;
	startupMessage.autoZoom = autoZoom;
	
	startupMessage.useMarkerClustering = useMarkerClustering;
	
	startupMessage.dragging = dragging;
	startupMessage.doubleClickZoom = doubleClickZoom;
	startupMessage.scrollWheelZoom = scrollWheelZoom;
	startupMessage.touchZoom = touchZoom;
	startupMessage.zoomControl = zoomControl;

    this.setState({ isLoading: false });
    this.updateDebugMessages("sending startup message");

    this.webViewRef.injectJavaScript(
      `window.postMessage(${JSON.stringify(startupMessage)}, '*');`
    );
  };

  // Add a new debug message to the debug message array
  private updateDebugMessages = (debugMessage: string) => {
    this.setState({
      debugMessages: [...this.state.debugMessages, debugMessage]
    });
  };

  private onError = (syntheticEvent: any) => {
    this.props.onError(syntheticEvent);
  };
  private onLoadEnd = () => {
    this.setState({ isLoading: false });
    this.props.onLoadEnd();
  };
  private onLoadStart = () => {
    this.setState({ isLoading: true });
    this.props.onLoadStart();
  };

  // Output rendered item to screen
  render() {
    const { debugMessages, webviewContent } = this.state;
    const {
      backgroundColor,
      doShowDebugMessages,
      loadingIndicator
    } = this.props;

    if (webviewContent) {
      return (
        <WebViewLeafletView
          backgroundColor={backgroundColor}
          debugMessages={debugMessages}
          doShowDebugMessages={doShowDebugMessages}
          handleMessage={this.handleMessage}
          webviewContent={webviewContent}
          loadingIndicator={loadingIndicator}
          onError={this.onError}
          onLoadEnd={this.onLoadEnd}
          onLoadStart={this.onLoadStart}
          setWebViewRef={(ref: WebView) => {
            this.webViewRef = ref;
          }}
        />
      );
    } else {
      return null;
    }
  }
}

export default WebViewLeaflet;
