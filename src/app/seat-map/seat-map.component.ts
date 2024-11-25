import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {environment} from "../../environments/environment";

interface Passenger {
    name: string;
}

interface Reservation {
    id: string;
    flight: string;
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
    flight: string;     // Añadimos esta propiedad
    aircraft: string;
    departure: string;
    airport: Airport;
    seat_map: Seat[];
}

interface SeatRow {
    left: Seat[];
    right: Seat[];
}

@Component({
    selector: 'app-seat-map',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './seat-map.component.html',
    styleUrls: ['./seat-map.component.css']
})
export class SeatMapComponent {
    // API URL
    private host: string = '';

    // Estado de UI
    isLoading = false;
    showSuccessMessage = false;
    showErrorMessage = false;
    isConfirmButtonEnabled = false;

    // Mensajes
    successMessage = '';
    errorMessage = '';
    seatMessage = '';
    currentSeatMessage = '';

    // Datos principales
    reservationCode = '';
    reservation: Reservation | null = null;
    flightData: Flight | null = null;
    seatRows: SeatRow[] = [];
    selectedSeats: string[] = [];
    tempSeats = 0;
    currentSeatPosition: { top: string; left: string } | null = null;

    constructor(private http: HttpClient) {
        // Inicializar host después de un pequeño delay para asegurar que env.js se cargó
        setTimeout(() => {
            // Usar la URL de la variable de entorno o el fallback
            this.host = environment.apis.be;
            console.log('API URL:', this.host);
        }, 100);
    }


    getReservation(): void {
        if (!this.isReservationCodeValid()) return;

        this.resetState();
        this.isLoading = true;

        setTimeout(() => {
            this.http.get<Reservation>(`${this.host}reservations/${this.reservationCode}`)
                .subscribe({
                    next: (data) => this.handleReservationResponse(data),
                    error: (err) => this.handleError('Error al obtener la reserva. Por favor, inténtelo de nuevo.', err),
                    complete: () => this.isLoading = false
                });
        }, 1000);
    }

    private handleReservationResponse(data: Reservation): void {
        if (data.status !== 'READY-TO-CHECK-IN') {
            this.showError(this.getErrorMessageForStatus(data.status));
            return;
        }

        this.reservation = data;
        this.getFlightData(data.flight);
    }

    private getFlightData(flightId: string): void {
        this.http.get<Flight>(`${this.host}flights/${flightId}`)
            .subscribe({
                next: (data) => {
                    this.flightData = data;
                    if (data.seat_map) {
                        this.buildSeatMap(data.seat_map);
                    }
                },
                error: (err) => this.handleError('Error al obtener los datos del vuelo.', err)
            });
    }

    // Manejo del mapa de asientos
    private buildSeatMap(seatMap: Seat[]): void {
        const processedSeatMap = this.processSeatMap(seatMap);
        this.seatRows = this.createSeatRows(processedSeatMap);
        this.resetSeatSelection();
    }

    private processSeatMap(seatMap: Seat[]): Seat[] {
        return seatMap.map(seat => ({
            ...seat,
            status: seat.status === 'reserved' ? 'reserved' : 'available'
        }));
    }

    private createSeatRows(seatMap: Seat[]): SeatRow[] {
        const rows: SeatRow[] = [];
        let rowLeft: Seat[] = [];
        let rowRight: Seat[] = [];

        seatMap.forEach((seat, index) => {
            if (index % 6 < 3) {
                rowLeft.push(seat);
            } else {
                rowRight.push(seat);
            }

            if ((index + 1) % 6 === 0) {
                rows.push({ left: rowLeft, right: rowRight });
                rowLeft = [];
                rowRight = [];
            }
        });

        if (rowLeft.length || rowRight.length) {
            rows.push({ left: rowLeft, right: rowRight });
        }

        return rows;
    }

    // Interacción con asientos
    onSeatClick(seat: Seat): void {
        if (seat.status === 'reserved') {
            this.showTemporarySeatMessage(`El asiento ${seat.seat} ya está reservado.`);
            return;
        }

        const maxSeats = this.reservation?.passengers?.length || 0;

        if (seat.status === 'available') {
            if (this.tempSeats < maxSeats) {
                this.selectSeat(seat);
            } else {
                this.showTemporarySeatMessage(
                    `Solo puede seleccionar ${maxSeats} asiento${maxSeats !== 1 ? 's' : ''} para ${maxSeats} pasajero${maxSeats !== 1 ? 's' : ''}.`
                );
            }
        } else if (seat.status === 'temp') {
            this.deselectSeat(seat);
        }

        this.updateConfirmButtonState();
        this.updateSeatSelectionMessage();
    }

    private selectSeat(seat: Seat): void {
        seat.status = 'temp';
        this.tempSeats++;
        this.selectedSeats.push(seat.seat);
    }

    private deselectSeat(seat: Seat): void {
        seat.status = 'available';
        this.tempSeats--;
        const index = this.selectedSeats.indexOf(seat.seat);
        if (index > -1) {
            this.selectedSeats.splice(index, 1);
        }
    }

    onMouseOver(seat: Seat, event: MouseEvent): void {
        if (seat.status === 'reserved' || seat.status === 'temp') {
            const message = seat.status === 'reserved'
                ? `El asiento ${seat.seat} está ocupado.`
                : `El asiento ${seat.seat} está en progreso.`;
            this.showSeatTooltip(message, event);
        }
    }

    onMouseLeave(): void {
        this.currentSeatMessage = '';
        this.currentSeatPosition = null;
    }

    // Confirmación de reserva
    confirmReservation(): void {
        if (!this.validateReservation()) return;

        this.isLoading = true;
        this.showSuccessMessage = false;

        setTimeout(() => {
            if (this.reservation) {
                this.reservation.status = 'CHECKED-IN';
                this.updateReservation();
            }
        }, 1000);
    }

    private updateReservation(): void {
        if (!this.reservation) return;

        this.http.put<Reservation>(`${this.host}reservations/${this.reservation.id}`, this.reservation)
            .subscribe({
                next: () => {
                    this.showSuccessMessage = true;
                    this.successMessage = '¡Check-in completado exitosamente!';
                    setTimeout(() => {
                        this.showSuccessMessage = false;
                        this.resetState();
                    }, 5000);
                },
                error: (err) => this.handleError('Error al actualizar la reserva. Por favor, inténtelo de nuevo.', err),
                complete: () => this.isLoading = false
            });
    }

    // Utilidades y helpers
    private resetState(): void {
        this.showErrorMessage = false;
        this.showSuccessMessage = false;
        this.errorMessage = '';
        this.successMessage = '';
        this.reservation = null;
        this.flightData = null;
        this.seatRows = [];
        this.resetSeatSelection();
    }

    private resetSeatSelection(): void {
        this.tempSeats = 0;
        this.selectedSeats = [];
        this.isConfirmButtonEnabled = false;
        this.seatMessage = '';
        this.currentSeatMessage = '';
    }

    private updateSeatSelectionMessage(): void {
        if (this.selectedSeats.length > 0) {
            const remaining = (this.reservation?.passengers?.length || 0) - this.selectedSeats.length;
            this.currentSeatMessage = remaining > 0
                ? `Asientos seleccionados: ${this.selectedSeats.join(', ')}. Faltan ${remaining} por seleccionar.`
                : `Asientos seleccionados: ${this.selectedSeats.join(', ')}`;
        } else {
            const passengerCount = this.reservation?.passengers?.length || 0;
            this.currentSeatMessage = `Seleccione ${passengerCount} asiento${passengerCount !== 1 ? 's' : ''}.`;
        }
    }

    private showSeatTooltip(message: string, event: MouseEvent): void {
        this.currentSeatMessage = message;
        const target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        this.currentSeatPosition = {
            top: `${rect.top + window.scrollY}px`,
            left: `${rect.left + window.scrollX + 50}px`,
        };
    }

    private showTemporarySeatMessage(message: string): void {
        this.seatMessage = message;
        setTimeout(() => this.seatMessage = '', 3000);
    }

    private updateConfirmButtonState(): void {
        const maxSeats = this.reservation?.passengers?.length || 0;
        this.isConfirmButtonEnabled = this.tempSeats === maxSeats;
    }

    private validateReservation(): boolean {
        if (!this.reservation || this.tempSeats !== this.reservation.passengers.length) {
            this.showTemporarySeatMessage('Por favor, seleccione el número correcto de asientos.');
            return false;
        }
        return true;
    }

    private showError(message: string): void {
        this.showErrorMessage = true;
        this.errorMessage = message;
        this.reservation = null;
    }

    private handleError(message: string, error: any): void {
        console.error(message, error);
        this.isLoading = false;
        this.showError(message);
    }

    getErrorMessageForStatus(status: string): string {
        const messages: Record<string, string> = {
            'CHECKED-IN': 'La reserva ya fue registrada para el check-in.',
            'DUE': 'La reserva está vencida y no puede registrarse.',
            'PENDING': 'La reserva aún no está lista para el check-in.',
        };
        return messages[status] || 'Estado desconocido para la reserva.';
    }

    closeErrorMessage(): void {
        this.showErrorMessage = false;
        this.errorMessage = '';
    }

    isReservationCodeValid(): boolean {
        return this.reservationCode.trim().length > 0;
    }
}