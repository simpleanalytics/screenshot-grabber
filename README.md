<a href="https://simpleanalytics.com/?ref=github.com/simpleanalytics/screenshot-grabber">
  <img src="https://assets.simpleanalytics.com/images/logos/logo-github-readme.png" alt="Simple Analytics logo" align="right" height="62" />
</a>

## Screenshots Grabber

You are welcome to help improving the screenshots we make. There are two files that are important:

1. [lib/adapters.js](https://github.com/simpleanalytics/screenshot-grabber/blob/master/lib/adapters.js) where you can specify certain filters
1. [utils/cleaners](https://github.com/simpleanalytics/screenshot-grabber/tree/master/utils/cleaners) if adapters are not sufficient and you need custom code

Just create a PR and we are happy to merge.

### Hide elements with a data attribute

If you are the website owner you can add `data-screenshot="hidden"` to the elements that you don't want to see in your screenshots. The Simple Analytics Screenshots Grabber will add a CSS style to the page where those elements get the style `display: none !important;`. This way those specific elements will be hidden from the screenshots. Thanks to [@woutervanlent](https://twitter.com/woutervanlent) for the suggestion.

```html
<p>This is visible in the screenshot</p>
<p data-screenshot="hidden">This is <strong>not</strong> visible in the screenshot</p>
```

If you don't have access to the website source code, read on.

### Hide elements with adapters

All website specific settings are stored in adapters. When you want to add a change for a website screenshot you basically want to edit [lib/adapters.js](https://github.com/simpleanalytics/screenshot-grabber/blob/master/lib/adapters.js) and add an adapter (object) for the website you want to edit.

In the adapter you specify the field hostname (it's required) regex. If you're not familiar with regexes you can just copy this (`/\.?example\.com$/i`).

> The grabber takes only one object from the array of adapters. So it's first found first used. If you want to have a different adapter for a specific **path** you can add a regex for a path too (`/^\/$/i,` for when you only want to select homepage). Please note that the more specific adapters (with hostname **and** path) need to be specified first. Otherwise the adapter without a path will be selected.

#### removeElementWithSelectors

Probably the most used option is `removeElementWithSelectors`. With this you can remove elements with selectors. It uses [`document.querySelector(...)`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) to select an element and will remove it when found.

```js
{
  hostname: /\.?instagram\.com$/i,
  removeElementWithSelectors: ['[id="react-root"] section > div']
}
```

#### clickElement

If you want to click on a button (of a cookie banner for example) you can use this:

```js
{
  hostname: /\.?yahoo\.com$/i,
  clickElement: '.consent-form [name="agree"]'
}
```

#### addStylesToElements

If you want to add styles to an element you can use this function. Useful when a `100vh` is used.

```js
{
  hostname: /\.?remoteok\.io$/i,
  addStylesToElements: [
    { elements: 'body > div.top', style: 'max-height', value: '600px' },
  ]
}
```

#### removeElementWithStyles

If you want to remove an element based on a style. A lot of websites have a specific color for a banner. Their class names can be autogenerated and unusable for selecting the element. With `removeElementWithStyles` you can select an element based on their [computed style](https://developer.mozilla.org/en-US/docs/Web/CSS/computed_value).

```js
{
  hostname: /\.?producthunt\.com$/i,
  removeElementWithStyles: [
    { selector: 'div', style: 'background-color', value: 'rgb(51, 51, 51)' },
  ]
}
```

### Other options

#### fullPage

Sometimes you want to disable the full page feature. You can do this like this:

```js
{
  hostname: /\.?(duckduckgo\.com)$/i,
  fullPage: false
}
```


### Links

- Inspired by [premieroctet/screen-guru](https://github.com/premieroctet/screen-guru)
- Using [thomasdondorf/puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster)
- Using [GoogleChrome/puppeteer](https://github.com/GoogleChrome/puppeteer)
