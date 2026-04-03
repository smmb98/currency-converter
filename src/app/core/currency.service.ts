import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  CurrenciesResponse,
  HistoricalResponse,
  LatestResponse,
} from './models/currency.models';

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getCurrencies(): Observable<CurrenciesResponse> {
    return this.http
      .get<CurrenciesResponse>(`${this.baseUrl}/currencies`)
      .pipe(catchError(this.handleError('Failed to load currencies. Please check your connection.')));
  }

  getLatest(base: string): Observable<LatestResponse> {
    return this.http
      .get<LatestResponse>(`${this.baseUrl}/latest?base=${base}`)
      .pipe(catchError(this.handleError('Failed to fetch latest exchange rates.')));
  }

  getHistorical(base: string, date: string): Observable<HistoricalResponse> {
    return this.http
      .get<HistoricalResponse>(`${this.baseUrl}/historical?base=${base}&date=${date}`)
      .pipe(catchError(this.handleError('Failed to fetch historical exchange rates.')));
  }

  private handleError(userMessage: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      const message =
        error.status === 0
          ? 'Cannot reach the server. Please ensure the backend is running.'
          : error.status === 400
          ? 'Invalid request. Please check your inputs.'
          : error.status === 502
          ? 'Currency data provider is unavailable. Please try again later.'
          : userMessage;
      return throwError(() => new Error(message));
    };
  }
}
