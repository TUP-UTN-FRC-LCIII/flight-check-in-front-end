import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // Importamos CommonModule para *ngIf y *ngFor
import { HttpClientModule } from '@angular/common/http'; // Importa HttpClientModule
import { FormsModule } from '@angular/forms'; // Importamos FormsModule para ngModel
import { DatePipe } from '@angular/common'; // Importamos DatePipe para el pipe 'date'

interface Passenger {
  name: string;
}

interface Reservation {
  id: string;
  flight: string;  // La propiedad 'flight' existe en la respuesta de la API
  status: string;
  passengers: Passenger[];
}

interface Airport {
  name: string;
  code: string;
  location: string;
}

interface Seat {
  seat: string;
  status: 'available' | 'reserved' | 'temp';
}

interface Flight {
  id: string;
  aircraft: string;
  departure: string;
  airport: Airport;
  seat_map: Seat[];  // Asegúrate de que seat_map esté tipado correctamente
}

@Component({
  selector: 'app-seat-map',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, HttpClientModule],
  templateUrl: './seat-map.component.html',
  styleUrls: ['./seat-map.component.css']
})

export class SeatMapComponent {
  reservationCode: string = ''; // Código de reserva ingresado
  reservation: any = null; // Detalles de la reserva
  flightData: any = null; // Datos del vuelo y mapa de asientos
  seatRows: any[] = []; // Filas de asientos
  seatMessage: string = ''; // Mensaje para mostrar cuando el usuario pasa el ratón o hace clic en un asiento
  tempSeats: number = 0; // Contador de asientos seleccionados
  isConfirmButtonEnabled: boolean = false; // Estado del botón Confirmar
  currentSeatMessage: string = ''; // Mensaje actual del asiento
  currentSeatPosition: { top: string; left: string } | null = null; // Posición del mensaje
  errorMessage: string = '';
  showErrorMessage: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getReservation();  // Verifica que esta función se esté ejecutando correctamente
  }

  getReservation() {
      this.http.get<Reservation>(`https://my-json-server.typicode.com/TUP-UTN-FRC-LCIII/flight-check-in-dummy/reservations/${this.reservationCode}`)
        .subscribe({
          next: (data) => {
            console.log('Estado de la reserva:', data.status);
            this.reservation = data;
            // Validar estado de la reserva antes de continuar
            if (data.status !== 'READY-TO-CHECK-IN') {
              this.showErrorMessage = true;
              this.reservation = null;
              this.errorMessage = this.getErrorMessageForStatus(data.status);
              return; // Terminar ejecución si el estado no es válido
            }
            // Estado válido, continuar con la lógica
            this.reservation = data;
            this.getFlightData(data.flight);
          },
          error: (err) => {
            console.error('Error al obtener la reserva:', err);
            this.showErrorMessage = true;
            this.errorMessage = 'Error al obtener la reserva. Por favor, inténtelo de nuevo.';
          }
        });
  }

  getFlightData(flightId: string) {
    this.http.get<Flight>(`https://my-json-server.typicode.com/TUP-UTN-FRC-LCIII/flight-check-in-dummy/flights/${flightId}`)
      .subscribe({
        next: (data) => {
          this.flightData = data;
          this.buildSeatMap(data.seat_map);  // Llamamos a la función para construir el mapa de asientos
        },
        error: (err) => {
          console.error('Error al obtener los datos del vuelo:', err);
          this.showErrorMessage = true;
          this.errorMessage = 'Error al obtener los datos del vuelo.';
        }
      });
  }

  buildSeatMap(seatMap: Seat[]) {
    const rows: any[] = [];
    let rowLeft: any[] = [];
    let rowRight: any[] = [];

    seatMap.forEach((seat, index) => {
      if (index % 6 < 3) {
        // Asientos de la izquierda (A, B, C)
        rowLeft.push(seat);
      } else {
        // Asientos de la derecha (D, E, F)
        rowRight.push(seat);
      }

      // Cuando se tienen 6 asientos (3 a la izquierda, 3 a la derecha), los añadimos como una fila
      if ((index + 1) % 6 === 0) {
        rows.push({ left: rowLeft, right: rowRight });
        rowLeft = [];
        rowRight = [];
      }
    });

    // Si hay asientos restantes que no llenan una fila completa
    if (rowLeft.length || rowRight.length) {
      rows.push({ left: rowLeft, right: rowRight });
    }

    this.seatRows = rows;
  }

  // Función para manejar el paso del mouse sobre un asiento
  onMouseOver(seat: Seat, event: MouseEvent) {
    if (seat.status === 'reserved') {
      this.currentSeatMessage = `El asiento ${seat.seat} está ocupado.`;
    } else if (seat.status === 'temp') {
      this.currentSeatMessage = `El asiento ${seat.seat} está en progreso.`;
    } else {
      this.currentSeatMessage = '';
    }

    if (this.currentSeatMessage) {
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      this.currentSeatPosition = {
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.left + window.scrollX + 50}px`, // Ajusta para posicionarlo al lado
      };
    }
  }

  onMouseLeave() {
    this.currentSeatMessage = '';
    this.currentSeatPosition = null;
  }

  onSeatClick(seat: Seat) {
    const maxSeats = this.reservation?.passengers?.length || 0;

    if (seat.status === 'available') {
      if (this.tempSeats < maxSeats) {
        seat.status = 'temp'; // Cambiar el estado a 'temp'
        this.tempSeats++;
      } else {
        this.seatMessage = `Solo puedes seleccionar ${maxSeats} asientos.`;
      }
    } else if (seat.status === 'temp') {
      // Si el asiento está en progreso, permite deseleccionarlo
      seat.status = 'available'; // Volver al estado disponible
      this.tempSeats--;
    } else {
      this.seatMessage = `El asiento ${seat.seat} no está disponible para selección.`;
    }

    // Verificar si el botón debe habilitarse
    this.isConfirmButtonEnabled = this.tempSeats === maxSeats;
  }

  confirmReservation() {
    if (!this.reservation) {
      console.error('No hay reserva para confirmar');
      return;
    }

    // Modificar el estado de la reserva
    this.reservation.status = 'CHECKED-IN';

    // Realizar el PUT para actualizar la reserva
    this.http.put<Reservation>(`https://my-json-server.typicode.com/TUP-UTN-FRC-LCIII/flight-check-in-dummy/reservations/${this.reservation.id}`, this.reservation)
      .subscribe(
        (response) => {
          console.log('Reserva confirmada:', response);
          // Aquí puedes manejar lo que sucede después de confirmar, por ejemplo, redirigir al usuario
        },
        (error) => {
          console.error('Error al confirmar la reserva:', error);
          // Puedes mostrar un mensaje de error aquí si algo falla
        }
      );
  }

  getErrorMessageForStatus(status: string): string {
    switch (status) {
      case 'CHECKED-IN':
        return 'La reserva ya fue registrada para el check-in.';
      case 'DUE':
        return 'La reserva está vencida y no puede registrarse.';
      case 'PENDING':
        return 'La reserva aún no está lista para el check-in.';
      default:
        return 'Estado desconocido para la reserva.';
    }
  }

  closeErrorMessage() {
    this.showErrorMessage = false;
    this.errorMessage = '';
  }

  isReservationCodeValid(): boolean {
    return this.reservationCode !== '' && this.reservationCode.trim().length > 0; // Validación básica
  }
}
