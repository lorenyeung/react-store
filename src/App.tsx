// @ts-nocheck

/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import './App.css';
import { CartItemDetails, CategoryDetails, StoreData } from './data/store-data';
import { Event, initialize } from '@harnessio/ff-javascript-client-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import Cart from './Store/Cart';
import { CartContext } from './Store/CartContext';
import Checkout from './Store/Checkout';
import Confirmation from './Store/Confirmation';
import Header from './Store/Header';
import Home from './Store/Home';
import ItemDetails from './Store/ItemDetails';
import List from './Store/List';
import { copyFile } from 'fs';

function App() {
  const storeData = useMemo(() => new StoreData(), []);
  const [categories, setCategories] = useState([] as CategoryDetails[]);
  const [cart, setCart] = useState(storeData.getCart());
  const [featureFlags, setFeatureFlags] = useState({});

  useEffect(() => {
    const cf = initialize(
      '<your-sdk-key-here>',
      {
        identifier: 'harnessuabooleanflag',
        attributes: {
          lastUpdated: Date(),
          host: window.location.href,
        },
      },
      {
        baseUrl: 'https://config.ff.harness.io/api/1.0',
        eventUrl: 'https://events.ff.harness.io/api/1.0',
      },
    );

    cf.on(Event.READY, flags => {
      setFeatureFlags(flags);
      console.log(flags);
    });

    cf.on(Event.CHANGED, flagInfo => {
      console.log(flagInfo);
      if (flagInfo.deleted) {
        setFeatureFlags(currentFeatureFlags => {
          delete currentFeatureFlags[flagInfo.flag];
          return { ...currentFeatureFlags };
        });
      } else {
        setFeatureFlags(currentFeatureFlags => ({ ...currentFeatureFlags, [flagInfo.flag]: flagInfo.value }));
      }
    });

    return () => {
      cf?.close();
    };
  }, []);
  useEffect(() => {
    storeData.getCategories().then(data => setCategories(data));
  }, [storeData]);

  function updateCart(cart: CartItemDetails[]) {
    storeData.setCart(cart);
    setCart(cart);
  }

  let className = featureFlags.harnessuabooleanflag ? 'App.Left' : 'App';

  return (
    <CartContext.Provider value={{ cart, setCart: updateCart }}>
      <Router>
        <div className={className}>
          <Header />
          <Switch>
            <Route exact path="/">
              <Home categories={categories} />
            </Route>
            <Route path="/list/:listId/:itemId">
              <ItemDetails />
            </Route>
            <Route path="/list/:listId">
              <List categories={categories} />
            </Route>
            <Route path="/cart">
              <Cart />
            </Route>
            <Route path="/checkout">
              <Checkout />
            </Route>
            <Route path="/confirm">
              <Confirmation />
            </Route>
          </Switch>
        </div>
      </Router>
    </CartContext.Provider>
  );
}

export default App;
