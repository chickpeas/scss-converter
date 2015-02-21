# SCSS converter 
SCSS converter find patterns and repeated properties in your CSS file and replace them with SCSS variables

to run it

```
node index /path/to/file.css
```
SCSS converter will create a /output folder with 
```
_mixins.scss
_variables.scss
sass-file.scss
```
in sass-file.scss all color value in background and color properties will be replaced,
SCSS converter also replace border-radius and box-shadow with
```css
@include border-radius($radius)

@include box-shadow($shadow)
```

