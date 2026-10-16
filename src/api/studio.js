import { request } from './index'
const read = (path, params, signal) =>
  request('GET', path, { params, signal, private: true })
const write = (method, path, body, idempotent = false) =>
  request(method, path, { body, private: true, idempotent })
const idPath = (id) => encodeURIComponent(String(id))
export const studioApi = {
  captures: (params, signal) => read('/admin/captures', params, signal),
  stats: (params, signal) => read('/admin/captures/stats', params, signal),
  capture: (id, signal) =>
    read('/admin/captures/' + idPath(id), undefined, signal),
  importCapture: (body) => write('POST', '/captures', body, true),
  saveCapture: (id, body) =>
    write('PUT', '/admin/captures/' + idPath(id), body),
  hold: (id, body) =>
    write('POST', '/admin/captures/' + idPath(id) + '/hold', body),
  release: (id, expectedVersion) =>
    write('POST', '/admin/captures/' + idPath(id) + '/release', {
      expectedVersion,
    }),
  remove: (id, expectedVersion) =>
    request('DELETE', '/admin/captures/' + idPath(id), {
      params: { expectedVersion },
      private: true,
    }),
  runs: (params, signal) => read('/admin/runs', params, signal),
  run: (id, signal) => read('/admin/runs/' + idPath(id), undefined, signal),
  startRun: (businessDate) =>
    write('POST', '/admin/runs', { businessDate }, true),
  retryRun: (id, expectedAttempt) =>
    write(
      'POST',
      '/admin/runs/' + idPath(id) + '/retry',
      { expectedAttempt },
      true,
    ),
  settings: (signal) => read('/admin/publishing-settings', undefined, signal),
  saveSettings: (body) => write('PUT', '/admin/publishing-settings', body),
}
