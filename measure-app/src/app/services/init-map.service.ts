import { Injectable } from '@angular/core';

import Map from 'ol/Map';
import View from 'ol/View';
import * as olProj from 'ol/proj';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

@Injectable({
  providedIn: 'root'
})
export class InitMapService {

  constructor() { }


  public create(map: Map, loc: Array<number>, zoom: number): Map {
    let raster = new TileLayer({
      source: new OSM()
    });

    // этот слой используется для измерений
    // он должен быть measure-map.service
    let source = new VectorSource();

    let vector = new VectorLayer({
      source: source,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#ffcc33'
          })
        })
      })
    });

    map = new Map({
      layers: [raster, vector],
      target: 'map',
      view: new View({
        center: loc,
        zoom: zoom
      })
    });

    //вернуть просто Map
    return [map, source];
  }

  public setCenterMap(map: Map, loc: string, zoom: number): void {
    const arrLoc: Array<string> = loc.split(',').reverse();
    map.setView(
      new View({
        center: olProj.fromLonLat(arrLoc),
        zoom: zoom
      })
    );
  }
}
