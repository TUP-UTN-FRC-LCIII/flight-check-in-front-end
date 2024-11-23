import { Routes } from '@angular/router';
import { SeatMapComponent } from './seat-map/seat-map.component';

export const routes: Routes = [
  { path: '' , component: SeatMapComponent }, // Página principal
  { path: 'seat-map', component: SeatMapComponent }, // Ruta para el mapa de asientos
];
