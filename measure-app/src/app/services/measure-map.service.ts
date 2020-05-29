import { Injectable } from '@angular/core';

import Map from 'ol/Map';
import { unByKey } from 'ol/Observable';
import Overlay from 'ol/Overlay';
import { getArea, getLength } from 'ol/sphere';
import View from 'ol/View';
import { LineString, Polygon } from 'ol/geom';
import Draw from 'ol/interaction/Draw';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';


@Injectable({
  providedIn: 'root'
})
export class MeasureMapService {

  constructor() { }

  // init метод должен принять ссылку на карту
  // и создать нужный слой
  // далее нужно предоставить методы для работы с измерениями
  // например метод начать измерение
  public initTools(map: Map, source: VectorSource) {
    /**
     * Currently drawn feature.
     * @type {import("../src/ol/Feature.js").default}
     */
    var sketch;


    /**
     * The help tooltip element.
     * @type {HTMLElement}
     */
    var helpTooltipElement;


    /**
     * Overlay to show the help messages.
     * @type {Overlay}
     */
    var helpTooltip;


    /**
     * The measure tooltip element.
     * @type {HTMLElement}
     */
    var measureTooltipElement;


    /**
     * Overlay to show the measurement.
     * @type {Overlay}
     */
    var measureTooltip;


    /**
     * Message to show when the user is drawing a polygon.
     * @type {string}
     */
    var continuePolygonMsg = 'Click to continue drawing the polygon';


    /**
     * Message to show when the user is drawing a line.
     * @type {string}
     */
    var continueLineMsg = 'Click to continue drawing the line';


    /**
     * Handle pointer move.
     * @param {import("../src/ol/MapBrowserEvent").default} evt The event.
     */
    var pointerMoveHandler = function (evt) {
      if (evt.dragging) {
        return;
      }
      /** @type {string} */
      var helpMsg = 'Click to start drawing';

      if (sketch) {
        var geom = sketch.getGeometry();
        if (geom instanceof Polygon) {
          helpMsg = continuePolygonMsg;
        } else if (geom instanceof LineString) {
          helpMsg = continueLineMsg;
        }
      }

      helpTooltipElement.innerHTML = helpMsg;
      helpTooltip.setPosition(evt.coordinate);

      helpTooltipElement.classList.remove('hidden');
    };

    map.on('pointermove', pointerMoveHandler);

    map.getViewport().addEventListener('mouseout', function () {
      helpTooltipElement.classList.add('hidden');
    });

    var typeSelect = document.getElementById('type');

    var draw; // global so we can remove it later


    /**
     * Format length output.
     * @param {LineString} line The line.
     * @return {string} The formatted length.
     */
      // я бы создал класс MeasureUtils куда бы поместил этот метод как статический
    var formatLength = function (line) {
      var length = getLength(line);
      var output;
      if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100) +
          ' ' + 'km';
      } else {
        output = (Math.round(length * 100) / 100) +
          ' ' + 'm';
      }
      return output;
    };


    /**
     * Format area output.
     * @param {Polygon} polygon The polygon.
     * @return {string} Formatted area.
     */
    // я бы создал класс MeasureUtils куда бы поместил этот метод как статический
    var formatArea = function (polygon) {
      var area = getArea(polygon);
      var output;
      if (area > 10000) {
        output = (Math.round(area / 1000000 * 100) / 100) +
          ' ' + 'km<sup>2</sup>';
      } else {
        output = (Math.round(area * 100) / 100) +
          ' ' + 'm<sup>2</sup>';
      }
      return output;
    };

    function addInteraction() {
      var type = ((<any>typeSelect).value == 'area' ? 'Polygon' : 'LineString');
      draw = new Draw({
        source: source,
        type: type,
        style: new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)'
          }),
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.5)',
            lineDash: [10, 10],
            width: 2
          }),
          image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({
              color: 'rgba(0, 0, 0, 0.7)'
            }),
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0.2)'
            })
          })
        })
      });
      map.addInteraction(draw);

      createMeasureTooltip();
      createHelpTooltip();

      var listener;
      draw.on('drawstart',
        function (evt) {
          // set sketch
          sketch = evt.feature;

          /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
          var tooltipCoord = evt.coordinate;

          listener = sketch.getGeometry().on('change', function (evt) {
            var geom = evt.target;
            var output;
            if (geom instanceof Polygon) {
              output = formatArea(geom);
              tooltipCoord = geom.getInteriorPoint().getCoordinates();
            } else if (geom instanceof LineString) {
              output = formatLength(geom);
              tooltipCoord = geom.getLastCoordinate();
            }
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
          });
        });

      draw.on('drawend',
        function () {
          measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
          measureTooltip.setOffset([0, -7]);
          // unset sketch
          sketch = null;
          // unset tooltip so that a new one can be created
          measureTooltipElement = null;
          createMeasureTooltip();
          unByKey(listener);
        });
    }


    /**
     * Creates a new help tooltip
     */
    function createHelpTooltip() {
      if (helpTooltipElement) {
        helpTooltipElement.parentNode.removeChild(helpTooltipElement);
      }
      helpTooltipElement = document.createElement('div');
      helpTooltipElement.className = 'ol-tooltip hidden';
      helpTooltip = new Overlay({
        element: helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
      });
      map.addOverlay(helpTooltip);
    }


    /**
     * Creates a new measure tooltip
     */
    function createMeasureTooltip() {
      if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
      }
      measureTooltipElement = document.createElement('div');
      measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
      measureTooltip = new Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
      });
      map.addOverlay(measureTooltip);
    }


    /**
     * Let user change the geometry type.
     */
    typeSelect.onchange = function () {
      map.removeInteraction(draw);
      addInteraction();
    };

    addInteraction();
  }
}
