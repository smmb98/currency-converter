import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, finalize } from 'rxjs/operators';
import { EMPTY, Observable } from 'rxjs';
import { CurrencyService } from '../../core/currency.service';
import { CurrencyMeta, HistoryRecord } from '../../core/models/currency.models';
import { LoadingSpinnerDirective } from '../../shared/directives/loading-spinner.directive';

const HISTORY_KEY = 'conversion_history';
const MAX_HISTORY = 20;

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTooltipModule,
    LoadingSpinnerDirective,
  ],
  templateUrl: './converter.component.html',
  styleUrls: ['./converter.component.scss'],
})
export class ConverterComponent implements OnInit {
  currencies: CurrencyMeta[] = [];
  currenciesLoading = false;
  currenciesError: string | null = null;

  from = '';
  to = '';
  amount: number | null = null;
  selectedDate: Date | null = null;
  formattedDate: string | null = null;

  converting = false;
  conversionError: string | null = null;
  amountError: string | null = null;

  result: number | null = null;
  resultRate: number | null = null;

  history: HistoryRecord[] = [];

  readonly maxDate: Date = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  })();

  constructor(private readonly currencyService: CurrencyService) {}

  ngOnInit(): void {
    this.loadHistory();
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    this.currenciesLoading = true;
    this.currenciesError = null;
    this.currencies = [];

    this.currencyService.getCurrencies().pipe(
      catchError((err: Error) => {
        this.currenciesError = err.message;
        return EMPTY;
      }),
      finalize(() => (this.currenciesLoading = false))
    ).subscribe((res) => {
      this.currencies = Object.values(res.data).sort((a, b) =>
        a.code.localeCompare(b.code)
      );
      this.from = 'USD';
      this.to = 'EUR';
    });
  }

  onDateChange(event: any): void {
    const d: Date | null = event.value;
    if (d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      this.formattedDate = `${y}-${m}-${day}`;
      this.selectedDate = d;
    } else {
      this.formattedDate = null;
      this.selectedDate = null;
    }
    this.result = null;
    this.conversionError = null;
  }

  clearDate(): void {
    this.formattedDate = null;
    this.selectedDate = null;
    this.result = null;
    this.conversionError = null;
  }

  swapCurrencies(): void {
    const tmp = this.from;
    this.from = this.to;
    this.to = tmp;
    this.result = null;
    this.conversionError = null;
  }

  convert(): void {
    if (!this.validateForm()) return;

    this.converting = true;
    this.conversionError = null;
    this.result = null;

    const src$ = this.formattedDate
      ? this.currencyService.getHistorical(this.from, this.formattedDate)
      : this.currencyService.getLatest(this.from);

    (src$ as Observable<any>).pipe(
      catchError((err: Error) => {
        this.conversionError = err.message;
        return EMPTY;
      }),
      finalize(() => (this.converting = false))
    ).subscribe((res) => {
      const rates = this.formattedDate
        ? res.data[this.formattedDate]
        : res.data;

      if (!rates || rates[this.to] === undefined) {
        this.conversionError = `Exchange rate for ${this.to} is not available.`;
        return;
      }

      const rate: number = rates[this.to];
      this.result = this.amount! * rate;
      this.resultRate = rate;
      this.saveHistory(rate);
    });
  }

  private validateForm(): boolean {
    this.amountError = null;
    this.conversionError = null;

    if (this.amount === null || this.amount === undefined || String(this.amount).trim() === '') {
      this.amountError = 'Please enter an amount.';
      return false;
    }
    if (isNaN(Number(this.amount)) || !isFinite(Number(this.amount))) {
      this.amountError = 'Amount must be a valid number.';
      return false;
    }
    if (this.amount <= 0) {
      this.amountError = 'Amount must be greater than zero.';
      return false;
    }
    if (this.amount > 1_000_000_000) {
      this.amountError = 'Amount is too large (max 1,000,000,000).';
      return false;
    }
    if (!this.from || !this.to) {
      this.conversionError = 'Please select both currencies.';
      return false;
    }
    if (this.from === this.to) {
      this.conversionError = 'From and To currencies must be different.';
      return false;
    }
    return true;
  }

  private saveHistory(rate: number): void {
    const record: HistoryRecord = {
      from: this.from,
      to: this.to,
      amount: this.amount!,
      result: this.result!,
      rate,
      date: this.formattedDate ?? 'latest',
      timestamp: new Date().toISOString(),
    };
    this.history.unshift(record);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
  }

  loadHistory(): void {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      this.history = raw ? JSON.parse(raw) : [];
    } catch {
      this.history = [];
    }
  }

  clearHistory(): void {
    this.history = [];
    localStorage.removeItem(HISTORY_KEY);
  }

  formatTimestamp(iso: string): string {
    const d = new Date(iso);
    return (
      d.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ' · ' +
      d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    );
  }

  get dropdownsDisabled(): boolean {
    return this.currenciesLoading || !!this.currenciesError;
  }

  getCurrencyName(code: string): string {
    return this.currencies.find((c) => c.code === code)?.name ?? '';
  }
}
