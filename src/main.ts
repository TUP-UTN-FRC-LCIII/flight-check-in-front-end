import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { HttpClientModule } from '@angular/common/http';  // Importamos HttpClientModule

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    HttpClientModule,  // Agregamos HttpClientModule a la lista de providers
  ],
}).catch(err => console.error(err));
