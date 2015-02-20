# SCSS converter 
SCSS converter find patterns and repeated properties in your CSS file and replace them with SCSS variables

to run it

```
node index /path/to/file.css
```

this will replace color in CSS properties:

```
color
background
border
```

and also replace border-radius and box-shadow with
```css
@mixin border-radius($radius) {
  -webkit-border-radius: $radius;
     -moz-border-radius: $radius;
      -ms-border-radius: $radius;
          border-radius: $radius;
}

@mixin box-shadow($shadow) {
  -webkit-box-shadow: $shadow;
     -moz-box-shadow:$shadow;
     -box-shadow: $shadow;
}
```