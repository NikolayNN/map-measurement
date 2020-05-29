import { Component, OnInit } from '@angular/core';

import Map from 'ol/Map';
import { Vector as VectorSource } from 'ol/source';

import { LocationService } from 'src/app/services/location.service';
import { InitMapService } from 'src/app/services/init-map.service';
import { MeasureMapService } from 'src/app/services/measure-map.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  //у нас из полей должен остаться только Map
  private map: Map;
  private sourceMap: VectorSource;
  private baseLocation: Array<number> = [-11000000, 4600000];
  private zoom: number = 12;

  constructor(
    private initMapService: InitMapService,
    private locationService: LocationService,
    private measureMapService: MeasureMapService,
  ) { }

  public ngOnInit(): void {

    // передавать как параметр map не имеет смысла
    // zoom и baseLocation в Map сервис
    [this.map, this.sourceMap] = this.initMapService.create(this.map, this.baseLocation, this.zoom);
    this.measureMapService.initTools(this.map, this.sourceMap);
    this.centeringMap();
  }

  // теперь эту логику можно перенести в MapService
  // т.е. в момент инициализациии карты мы будем ее центрировать
  private centeringMap(): void {
    this.locationService.getLocation().subscribe(
      response => {
        this.initMapService.setCenterMap(this.map, response.loc, this.zoom);
      });
  }
}
