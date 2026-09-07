import { renderToString } from 'react-dom/server';
import React from 'react';
import { Home } from 'react-iconly';

console.log(renderToString(React.createElement(Home, { className: 'test-class', style: { width: 24, height: 24 } })));
