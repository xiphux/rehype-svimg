# Changelog

## 1.0.0

* BREAKING: rehype-svimg is now a named export instead of a default export (import { rehypeSvimg } from 'rehype-svimg' instead of import rehypeSvimg from 'rehype-svimg')
* BREAKING: Drop Node 12 support
* Code now targets ES2017
* Support srcGenerator svimg option
* Support skip option to skip processing images

## 0.3.0

* Update svimg for AVIF support

## 0.2.1

* Update svimg for placeholder blur handling changes

## 0.2.0

* Support blur and quality svimg options

## 0.1.3

* Skip placeholder generation if immediate is set

## 0.1.2

* Add srcPrefix option

## 0.1.1

* Handle svimg's queue changes

## 0.1.0

* Initial release of svimg rehype plugin