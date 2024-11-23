import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // Mantén RouterOutlet si usas rutas

@Component({
  selector: 'app-root',
  standalone: true, // Componente autónomo
  imports: [RouterOutlet], // Solo importamos RouterOutlet
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Flight Check-In';
}
