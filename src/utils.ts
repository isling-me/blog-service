import * as jwt from 'jsonwebtoken';
import slugify from 'slugify';

export const APP_SECRET = 'secretvl@#/4';

export const jwtOptions = {
  expiresIn: '15d',
  issuer: 'isling.me'
};

interface logFunctionInterface {
  (message: string): void;
}

interface LoggerInterface {
  info: logFunctionInterface;
  debug: logFunctionInterface;
  error: logFunctionInterface;
}

export declare interface CurrentUserInterface {
  auth: boolean;
  id?: string;
  role?: string;
}

export declare interface LazyRunInterface {
  __run: boolean;
}

export declare interface AuthPayloadInterface {
  sub: string;
  role: string;
}

export class Logger implements LoggerInterface {
  readonly prefix: string;

  constructor(prefix?: string) {
    this.prefix = `[${prefix}]` || '';
  }

  info(message: string) {
    console.log(this.prefix, message);
  }

  debug(message: string) {
    console.log(this.prefix, message);
  }

  error(message: string) {
    console.log(this.prefix, message);
  }
}

function getCurrentUserCore(request): CurrentUserInterface {
  const { authorization } = request.request.headers;
  if (authorization) {
    const token = authorization.replace('Bearer ', '');
    const payload = jwt.verify(token, APP_SECRET, jwtOptions);

    return {
      auth: true,
      id: (payload as AuthPayloadInterface).sub,
      role: (payload as AuthPayloadInterface).role
    };
  }

  return {
    auth: false,
    id: null
  };
}

export function getCurrentUser(request: any): CurrentUserInterface {
  const init: CurrentUserInterface & LazyRunInterface = {
    __run: false,
    auth: false,
    id: null
  };

  return new Proxy(init, {
    get(target, p) {
      if (!target.__run) {
        const u = getCurrentUserCore(request);
        Object.assign(target, { __run: true }, u);
        return Reflect.get(target, p);
      }
      return Reflect.get(target, p);
    }
  });
}

export function trimAllowUndefined(
  string: string | undefined | null
): string | undefined {
  if (typeof string === 'string') {
    return string.trim();
  }
  return undefined;
}

export function slugifyLower(string: string | undefined): string | undefined {
  if (typeof string === 'string') {
    return slugify(string, {
      lower: true
    });
  }
  return undefined;
}

export function getHTTPuri(uri: string): string {
  if (uri.toLowerCase().includes('tcp')) {
    return `http${uri.slice(3)}`;
  }
  return uri;
}
