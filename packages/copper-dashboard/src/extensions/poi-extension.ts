import { MessageBusHandle } from '@csnext/cs-core';
import { Feature, Point, FeatureCollection, GeometryObject } from 'geojson';
import Axios from 'axios';
import { LngLatBounds } from 'mapbox-gl';
import throttle from 'lodash.throttle';
import { AppState } from '@csnext/cs-client';
import { GeojsonPlusLayer, ILayerExtension, ILayerExtensionType, IMapLayer } from '@csnext/cs-map';

export interface IPoiExtensionOptions {
    // #region Properties (3)
    categories?: string[];
    url?: string;
    iconUrl?: string;
    // #endregion Properties (3)
}

// 2e65a14a9f9368ceb7b5e7622911b261
// 20710e89c5f8e7fe

export const DEFAULT_OVERPASS_URL = 'http://overpass.openstreetmap.fr/api/interpreter';
export const DEFAULT_ICON_URL = 'https://raw.githubusercontent.com/rinzeb/osm-icons/master/png/osm{{AMENITY}}.png';

export class PoiExtension implements ILayerExtension, ILayerExtensionType, IPoiExtensionOptions {
    // #region Properties (10)

    public id: string = 'poi';    
    public url?: string;
    public iconUrl?: string;
    public title?: string | undefined;
    private _query?: string;
    private _handle?: MessageBusHandle;
    private _layer?: GeojsonPlusLayer;
    private _originalFeatures?: Array<Feature<Point>> = [];
    private mapMoved = this.onMove.bind(this);

    // #endregion Properties (10)

    // #region Constructors (1)

    public constructor(init?: Partial<ILayerExtension>) {
        Object.assign(this, init);
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    public getInstance(init?: Partial<ILayerExtension>) {
        const result = new PoiExtension(init);
        return result;
    }

    public start(layer: IMapLayer) {
        console.log('Start poi extension');
        this._layer = layer as GeojsonPlusLayer;
        // load feature types
        let url = this.url || DEFAULT_OVERPASS_URL;
        Axios.get(`${url}/layers/pois`).then(res => {
            if (res.data) {
                const poiLayer = res.data as IMapLayer;
                if (poiLayer.featureTypes) {
                    this._layer!.featureTypes = poiLayer.featureTypes;
                }
                
                this._layer!.updateImages();
                this.getQuery();
            }
        })

        this.subscribeToMapEvents();
        this.addIcon(); 
        
        console.log(this._layer);
    }

    public stop() {
        this.restoreOriginalFeatures();
    }

    // #endregion Public Methods (3)

    // #region Private Methods (6)

    private restoreOriginalFeatures() {
        if (!this._layer || !this._originalFeatures) { return; }
        this._layer._source!._data!.features = this._originalFeatures;
        this._layer._manager!.updateLayerSource(this._layer);
        if (this._layer && this._layer._manager) {
            this._layer._manager!.MapControl!.off('moveend', this.mapMoved);
        }
    }

    private onMove(e: mapboxgl.MapboxEvent) {
        this.getQuery();
    }

    private addIcon() {
        if (!this._layer) return;
        // this._layer._manager!.MapWidget!.addImage(this.amenity, DEFAULT_ICON_URL.replace('{{AMENITY}}', this.amenity));
    }

    private subscribeToMapEvents() {
        if (this._layer && this._layer._manager) {
            this._layer._manager!.MapControl!.on('moveend', this.mapMoved);
        }
    }

    private getQuery = throttle(() => this.getQueryThrottled(), 1500);

    private async getQueryThrottled() {        
        if (!this._layer || !this._layer._source || !this._originalFeatures) { return; }
        const source = this._layer._source;
        const manager = this._layer._manager!;
        const viewBox = manager.MapControl!.getBounds();
        const zoom = manager.MapControl!.getZoom();
        if (zoom <= 5) {
            AppState.Instance.triggerNotification({ title: 'Zoomlevel not supported, zoom in to view features', timeout: 2500 });
            return;
        }
        if (source && source._data && source._data.features) {
            const osmData = await this.query(viewBox);
            if (source && source._data && source._data.features && osmData && osmData.features) {
                source!._data!.features = osmData.features;
                manager!.updateLayerSource(this._layer);                
                console.log(`Updated OSM features: #${osmData.features.length} for view ${viewBox.toString()}`);
            }
        }
    }

    private async query(viewBox: LngLatBounds): Promise<FeatureCollection> {
        return new Promise((response, reject) => {
            if (!this._layer) {
                console.log('No layer');
                 reject(); }
            let url = this.url || DEFAULT_OVERPASS_URL;
            
            url += `/sources/pois?bbox=${viewBox.getWest()},${viewBox.getSouth()},${viewBox.getEast()},${viewBox.getNorth()}`;
            if (this._layer?.activeFeatureTypes) {
                url+='&types=' + this._layer.activeFeatureTypes.join(',');
            }
            console.log(url);
            // const query = `[out:json];node[amenity=${this.amenity}](${viewBox.getSouth()},${viewBox.getWest()},${viewBox.getNorth()},${viewBox.getEast()});out;`;
            Axios.get(url).then(async r => {
                if (r.data) {
                    if (r.data) {
                        const geojson = r.data as FeatureCollection; // osmtogeojson(r.data, { flatProperties: true } as osmtogeojson.OsmToGeoJSONOptions) as FeatureCollection;
                        response(geojson);
                        return;
                    }
                } else {
                    reject('Error loading overpass data');
                }
            }).catch((e) => {
                reject(e);
            });
        });
    }

    // #endregion Private Methods (6)
}
