import OasFragment, { FragmentType } from '@/core/OasFragment';
import { injectable } from 'inversify';
import { Oas20Operation, Oas20PathItem } from 'oai-ts-core';

@injectable()
class OperationFragment extends OasFragment<Oas20Operation> {
  public type = FragmentType.Operation;

  public get id() {
    return this.document.operationId;
  }

  public get introduction() {
    const summary = (this.document.summary || '').replace(/[\n\r\s]+/g, ' ');
    const description = (this.document.description || '').replace(/[\n\r\s]+/g, ' ');

    return `${summary || description} ${summary && description ? '-' : ''} ${description || ''}`.trim();
  }

  public get deprecated() {
    return this.document.deprecated;
  }

  public get method() {
    return this.document.method().toUpperCase();
  }

  public get path() {
    return (this.document.parent() as Oas20PathItem).path();
  }

  public get title() {
    const t = `${this.document.operationId}Request`;

    return `${t.charAt(0).toUpperCase()}${t.substr(1)}`;
  }

  public get parameters() {
    return this.document.parameters || [];
  }

  public get responseStatusCodes() {
    return this.document.responses.responseStatusCodes() || [];
  }

  public get responseSuccessCodes() {
    return this.responseStatusCodes.filter(code => code >= '200' && code <= '299');
  }

  public get responseFailCodes() {
    return this.responseStatusCodes.filter(code => code < '200' || code > '299');
  }
}

export default OperationFragment;
