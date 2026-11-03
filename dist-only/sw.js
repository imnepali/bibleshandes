/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-5d155c7a'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "848f0b89b5260022f4862ef610ca1f97"
  }, {
    "url": "pwa-512x512.png",
    "revision": "1c0f197275d5017968d022a6d7f04883"
  }, {
    "url": "pwa-192x192.png",
    "revision": "985ed7796004d83b2f8abf7e84de9dd0"
  }, {
    "url": "index.html",
    "revision": "d17ed3767daaa8f0b86cc66f063f1e24"
  }, {
    "url": "icon.svg",
    "revision": "b0a0684dc6807a4e0cb5e3a1bbeedbca"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "ceebeb49d1f80161aa9e9b4dab4f289d"
  }, {
    "url": "assets/index-CA2MHJ0t.css",
    "revision": null
  }, {
    "url": "assets/index-6H0CNm-h.js",
    "revision": null
  }, {
    "url": "assets/aistudio/image_fed91b50.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_fdd464b1.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_ee8d97c9.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_e9efb494.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_d6c7195f.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_d40a1d65.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_b41b0d65.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_b347cd44.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_b1cd7a50.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_abdbdc1a.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_aab6586f.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_a947aa08.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_9e47e4cf.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_9b397445.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_94602c3c.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_9297e97e.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_916e4a9a.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_8eb44a36.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_86dbdd12.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_8235fd25.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_775bc5e2.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_5bacf799.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_4e1a2ab5.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_42266620.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_3fb48649.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_34762c79.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_312e60b5.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_2e71cb9f.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_2d66d8cd.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_2cf5d11c.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_1c41628c.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_124cf814.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_084a715c.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_05744a49.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_054ff0f8.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_04f7fecc.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_00b45a84.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_00426bc0.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Bible_Sandesh__Radiant_Faith_Emblem_c37247e4.png",
    "revision": null
  }, {
    "url": "art/news-fellowship.svg",
    "revision": "01c368a70caa63f5a6a03bbbde4f62b4"
  }, {
    "url": "art/hero-himalayan-church.svg",
    "revision": "89f57a54e921a9c25c34abd519f1d09e"
  }, {
    "url": "art/gallery-pokhara.svg",
    "revision": "dcbd76188356bf7107fac37f388fd193"
  }, {
    "url": "art/bible-study.svg",
    "revision": "77dcbb266f3dfc4b382ec3fcb01fe220"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "ceebeb49d1f80161aa9e9b4dab4f289d"
  }, {
    "url": "icon.svg",
    "revision": "b0a0684dc6807a4e0cb5e3a1bbeedbca"
  }, {
    "url": "pwa-192x192.png",
    "revision": "985ed7796004d83b2f8abf7e84de9dd0"
  }, {
    "url": "pwa-512x512.png",
    "revision": "1c0f197275d5017968d022a6d7f04883"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "848f0b89b5260022f4862ef610ca1f97"
  }, {
    "url": "manifest.webmanifest",
    "revision": "3628a20928e18a5817498e51311f60c9"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/\/api\/(bible|calendar|rates|news|radio|events|gallery)/i, new workbox.NetworkFirst({
    "cacheName": "susamachar-api-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 604800
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/\/bible-quiz\/.*\.json$/i, new workbox.CacheFirst({
    "cacheName": "biblesandes-quiz-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 70,
      maxAgeSeconds: 7776000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
