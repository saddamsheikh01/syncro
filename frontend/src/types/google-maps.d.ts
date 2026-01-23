declare namespace google {
  namespace maps {
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface Padding {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    }

    class LatLngBounds {
      extend(latLng: LatLngLiteral): void;
    }

    class Circle {
      constructor(opts: { center: LatLngLiteral; radius: number });
      getBounds(): LatLngBounds | null;
    }

    interface MapOptions {
      center: LatLngLiteral;
      zoom: number;
      mapId?: string;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      gestureHandling?: string;
      styles?: Array<Record<string, unknown>>;
    }

    class Map {
      constructor(el: HTMLElement, opts: MapOptions);
      panTo(latLng: LatLngLiteral): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds, padding?: number | Padding): void;
    }

    namespace marker {
      class AdvancedMarkerElement {
        constructor(opts: {
          map?: Map | null;
          position?: LatLngLiteral;
          content?: Node | null;
          title?: string;
          zIndex?: number;
        });
        map: Map | null;
        content?: Node | null;
        addListener(eventName: string, handler: () => void): void;
      }
    }

    namespace places {
      interface AutocompleteOptions {
        fields?: string[];
        types?: string[];
        componentRestrictions?: { country: string | string[] };
        bounds?: LatLngBounds | null;
      }

      interface PlaceGeometry {
        location?: { lat: () => number; lng: () => number };
      }

      interface PlaceResult {
        place_id?: string;
        name?: string;
        formatted_address?: string;
        geometry?: PlaceGeometry;
        types?: string[];
      }

      class Autocomplete {
        constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
        addListener(eventName: string, handler: () => void): void;
        getPlace(): PlaceResult;
        setBounds(bounds: LatLngBounds | null): void;
      }
    }

    interface MapsLibrary {
      Map: typeof Map;
    }

    interface MarkerLibrary {
      AdvancedMarkerElement: typeof marker.AdvancedMarkerElement;
    }

    function importLibrary(name: "maps"): Promise<MapsLibrary>;
    function importLibrary(name: "marker"): Promise<MarkerLibrary>;

    namespace event {
      function clearInstanceListeners(instance: object): void;
    }
  }
}
