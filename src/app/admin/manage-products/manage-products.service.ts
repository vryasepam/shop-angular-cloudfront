import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { EMPTY, Observable, throwError, catchError } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class ManageProductsService extends ApiService {
  uploadProductsCSV(file: File): Observable<unknown> {
    if (!this.endpointEnabled('import')) {
      console.warn(
        'Endpoint "import" is disabled. To enable change your environment.ts config',
      );
      return EMPTY;
    }

    return this.getPreSignedUrl(file.name).pipe(
      catchError((error: unknown) => this.handleError(error)),
      switchMap((url) =>
        this.http.put(url, file, {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'text/csv',
          },
        }),
      ),
    );
  }

  private getPreSignedUrl(fileName: string): Observable<string> {
    const url = this.getUrl('import', 'import');

    const authToken: string | null = localStorage.getItem(
      'authorization_token',
    );

    const headers: Record<string, string> = {};

    if (authToken) {
      headers.Authorization = `Basic ${localStorage.getItem('authorization_token')}`;
    }

    return this.http.get<string>(url, {
      headers,
      params: {
        name: fileName,
      },
    });
  }

  private handleError(error: unknown) {
    const httpResponseError = error as HttpErrorResponse;

    let message = '';

    switch (httpResponseError.status) {
      case 401:
        message = 'Authorization header is not set';
        break;
      case 403:
        message = 'Access denied, authorization header is not valid';
        break;
    }

    if (message) {
      alert(message);
    }

    return throwError(() => new Error(httpResponseError.message));
  }
}
