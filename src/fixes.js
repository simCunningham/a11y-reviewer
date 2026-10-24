// Plain-language explanations and fixes for the axe-core rules people hit most.
// Rules not listed here fall back to axe's own help text (see getFix).

const FIXES = {
  'image-alt': {
    why: 'Screen reader users hear nothing (or the file name) for images without a text alternative.',
    fix: 'Add an alt attribute that says what the image shows or does. If it is purely decorative, use alt="" so screen readers skip it.',
    example: '<img src="team.jpg" alt="Our five-person support team at the 2025 offsite">',
  },
  'input-image-alt': {
    why: 'Image buttons with no text are announced as just "button", so users cannot tell what they do.',
    fix: 'Add an alt attribute that describes the action, such as "Search" or "Submit order".',
    example: '<input type="image" src="go.png" alt="Search">',
  },
  'role-img-alt': {
    why: 'Elements marked as images need a text alternative just like <img> does.',
    fix: 'Give the element an aria-label or aria-labelledby that describes the image.',
    example: '<div role="img" aria-label="Five star rating">...</div>',
  },
  'svg-img-alt': {
    why: 'An SVG marked as an image has no text for screen readers to read.',
    fix: 'Add a <title> inside the SVG, or an aria-label on the <svg> element.',
    example: '<svg role="img" aria-label="Company logo">...</svg>',
  },
  'color-contrast': {
    why: 'Low-contrast text is hard or impossible to read for people with low vision or color blindness, and for anyone in bright sunlight.',
    fix: 'Darken the text or lighten the background until the contrast ratio is at least 4.5:1 for normal text, or 3:1 for large text (24px, or 19px bold). A contrast checker shows the exact ratio.',
    example: 'color: #767676 on white is the lightest gray that passes 4.5:1.',
  },
  'color-contrast-enhanced': {
    why: 'This is the stricter AAA contrast level, helpful for people with more severe low vision.',
    fix: 'Raise the contrast ratio to 7:1 for normal text, or 4.5:1 for large text.',
  },
  'label': {
    why: 'Without a label, screen reader users hear "edit text" with no idea what to type, and clicking the label text does not focus the field.',
    fix: 'Connect a visible <label> to the field with for/id, or wrap the field in the label. Placeholder text alone is not a label.',
    example: '<label for="email">Email address</label>\n<input id="email" type="email">',
  },
  'select-name': {
    why: 'A dropdown with no label is announced without any context.',
    fix: 'Add a <label for="..."> that matches the select\'s id, or an aria-label.',
    example: '<label for="country">Country</label>\n<select id="country">...</select>',
  },
  'button-name': {
    why: 'Buttons with no text (often icon-only buttons) are announced as just "button".',
    fix: 'Put visible text inside the button, or add an aria-label describing what it does.',
    example: '<button aria-label="Close dialog"><svg aria-hidden="true">...</svg></button>',
  },
  'link-name': {
    why: 'Links with no text (often icon or image links) are announced as just "link" or as the URL.',
    fix: 'Add text inside the link, alt text on an image inside it, or an aria-label.',
    example: '<a href="/cart" aria-label="Shopping cart"><svg aria-hidden="true">...</svg></a>',
  },
  'link-in-text-block': {
    why: 'If links inside paragraphs are shown by color alone, people who cannot see that color difference cannot find them.',
    fix: 'Underline links in body text, or give them a 3:1 contrast with surrounding text plus a non-color cue on hover and focus.',
    example: 'p a { text-decoration: underline; }',
  },
  'document-title': {
    why: 'The page title is the first thing a screen reader announces and what appears in browser tabs and bookmarks.',
    fix: 'Add a unique, descriptive <title> in the <head>.',
    example: '<title>Checkout - Acme Store</title>',
  },
  'html-has-lang': {
    why: 'Without a language, screen readers may read the page with the wrong pronunciation rules.',
    fix: 'Add a lang attribute to the <html> element.',
    example: '<html lang="en">',
  },
  'html-lang-valid': {
    why: 'An invalid language code is as unhelpful as no language at all.',
    fix: 'Use a valid BCP 47 code such as "en", "en-US", "fr" or "es".',
    example: '<html lang="en-US">',
  },
  'valid-lang': {
    why: 'An invalid language code on part of the page makes screen readers mispronounce it.',
    fix: 'Use a valid language code in the lang attribute, such as "fr" or "de".',
  },
  'heading-order': {
    why: 'Screen reader users navigate by headings; skipped levels (h2 straight to h4) make the outline confusing.',
    fix: 'Use heading levels in order without skipping. Style headings with CSS rather than picking a level for its size.',
  },
  'page-has-heading-one': {
    why: 'A top-level heading tells users what the page is about and gives them a place to jump to.',
    fix: 'Add one <h1> that describes the main content of the page.',
    example: '<h1>Order history</h1>',
  },
  'empty-heading': {
    why: 'Empty headings show up in screen reader heading lists as blank entries.',
    fix: 'Put text in the heading or remove it.',
  },
  'landmark-one-main': {
    why: 'A main landmark lets keyboard and screen reader users jump straight to the content.',
    fix: 'Wrap the primary content of the page in a <main> element.',
    example: '<main id="content">...</main>',
  },
  'region': {
    why: 'Content outside landmarks is easy to miss for people who navigate by landmark.',
    fix: 'Place all content inside landmarks such as <header>, <nav>, <main> and <footer>.',
  },
  'landmark-unique': {
    why: 'When two landmarks of the same type have the same name, users cannot tell them apart.',
    fix: 'Give each repeated landmark (for example, two <nav> elements) a distinct aria-label.',
    example: '<nav aria-label="Primary">...</nav>\n<nav aria-label="Footer">...</nav>',
  },
  'bypass': {
    why: 'Keyboard users have to tab through every navigation link on every page to reach the content.',
    fix: 'Add a "Skip to main content" link as the first focusable element, and use a <main> landmark.',
    example: '<a class="skip-link" href="#content">Skip to main content</a>',
  },
  'list': {
    why: 'Lists with the wrong children are not announced as lists, so users lose the item count and structure.',
    fix: 'Make sure <ul> and <ol> contain only <li> elements (or <script>/<template>).',
  },
  'listitem': {
    why: 'An <li> outside a list is not announced as part of a list.',
    fix: 'Wrap <li> elements in a <ul> or <ol>.',
  },
  'duplicate-id-aria': {
    why: 'When IDs used by labels or ARIA are duplicated, assistive technology may read the wrong label.',
    fix: 'Make every id on the page unique, especially ones referenced by for, aria-labelledby or aria-describedby.',
  },
  'aria-allowed-attr': {
    why: 'ARIA attributes that do not belong on an element are ignored or can confuse screen readers.',
    fix: 'Remove the ARIA attribute, or change the element\'s role to one that supports it.',
  },
  'aria-required-attr': {
    why: 'Some ARIA roles need certain attributes to work (for example, a checkbox role needs aria-checked).',
    fix: 'Add the required ARIA attributes for the role, or use the native HTML element instead.',
    example: '<div role="checkbox" aria-checked="false" tabindex="0">...',
  },
  'aria-valid-attr-value': {
    why: 'An ARIA attribute with an invalid value is ignored or misread.',
    fix: 'Correct the value (for example, aria-expanded must be "true" or "false", and ID references must point to existing elements).',
  },
  'aria-valid-attr': {
    why: 'Misspelled ARIA attributes do nothing.',
    fix: 'Check the attribute name for typos against the ARIA specification.',
  },
  'aria-roles': {
    why: 'An invalid role value is ignored by assistive technology.',
    fix: 'Use a valid ARIA role, or better, a native HTML element that already has the role.',
  },
  'aria-hidden-focus': {
    why: 'Keyboard users can tab to elements that screen readers have been told to ignore, landing on "nothing".',
    fix: 'Remove focusable elements from inside aria-hidden="true" containers, or add tabindex="-1" / the inert attribute to them.',
  },
  'aria-hidden-body': {
    why: 'aria-hidden on the <body> hides the whole page from screen readers.',
    fix: 'Remove aria-hidden="true" from the <body> element.',
  },
  'aria-command-name': {
    why: 'Custom buttons, links and menu items with no name are announced without any description.',
    fix: 'Add visible text or an aria-label to the element.',
  },
  'aria-input-field-name': {
    why: 'Custom input fields with no name give screen reader users no idea what to enter.',
    fix: 'Add an aria-label or aria-labelledby pointing to visible label text.',
  },
  'aria-toggle-field-name': {
    why: 'Custom checkboxes, switches and radios with no name cannot be understood.',
    fix: 'Add visible text inside the element, or an aria-label.',
  },
  'aria-dialog-name': {
    why: 'A dialog without a name is announced as just "dialog".',
    fix: 'Add aria-labelledby pointing to the dialog\'s heading, or an aria-label.',
    example: '<div role="dialog" aria-labelledby="dlg-title"><h2 id="dlg-title">Delete file?</h2>',
  },
  'aria-progressbar-name': {
    why: 'A progress bar with no name does not say what is loading.',
    fix: 'Add an aria-label such as "Uploading photo".',
  },
  'aria-required-children': {
    why: 'Some roles (like list, menu, tablist) must contain specific child roles to be understood.',
    fix: 'Add the expected child roles (for example, role="tab" inside role="tablist").',
  },
  'aria-required-parent': {
    why: 'Some roles (like tab, menuitem, listitem) only make sense inside a specific parent role.',
    fix: 'Wrap the element in the required parent role.',
  },
  'frame-title': {
    why: 'Screen reader users hear "frame" with no idea what is inside it.',
    fix: 'Add a title attribute to the <iframe> describing its content.',
    example: '<iframe src="map.html" title="Store location map"></iframe>',
  },
  'meta-viewport': {
    why: 'Disabling zoom prevents people with low vision from enlarging the page on mobile.',
    fix: 'Remove user-scalable=no and any maximum-scale below 5 from the viewport meta tag.',
    example: '<meta name="viewport" content="width=device-width, initial-scale=1">',
  },
  'meta-refresh': {
    why: 'Automatic page refreshes or redirects can disorient users and interrupt screen readers.',
    fix: 'Remove the timed <meta http-equiv="refresh">, or let users control the refresh.',
  },
  'tabindex': {
    why: 'Positive tabindex values change the keyboard order in ways that are hard to follow.',
    fix: 'Use tabindex="0" or "-1" only, and arrange the DOM so the natural order makes sense.',
  },
  'scrollable-region-focusable': {
    why: 'Keyboard users cannot scroll a scrollable area they cannot focus.',
    fix: 'Add tabindex="0" to the scrollable container (and a label), or make sure it contains a focusable element.',
  },
  'nested-interactive': {
    why: 'Putting a button inside a link (or similar) confuses screen readers and keyboard behavior.',
    fix: 'Separate the interactive elements so none is nested inside another.',
  },
  'target-size': {
    why: 'Small, tightly packed touch targets are hard to hit for people with tremors or limited dexterity (WCAG 2.2, 2.5.8).',
    fix: 'Make clickable targets at least 24 by 24 CSS pixels, or leave enough space around them so a 24px circle does not overlap another target.',
    example: '.icon-button { min-width: 24px; min-height: 24px; }',
  },
  'video-caption': {
    why: 'Deaf and hard-of-hearing users cannot follow video audio without captions.',
    fix: 'Add a captions track to the video.',
    example: '<track kind="captions" src="intro.vtt" srclang="en" label="English">',
  },
  'audio-caption': {
    why: 'Audio content needs a text alternative for people who cannot hear it.',
    fix: 'Provide a transcript or captions for the audio.',
  },
  'td-headers-attr': {
    why: 'Table cells that point to missing headers are read without context.',
    fix: 'Make sure every id listed in a cell\'s headers attribute belongs to a header cell in the same table.',
  },
  'th-has-data-cells': {
    why: 'Header cells that describe nothing confuse the table structure.',
    fix: 'Remove unused header cells or turn them into regular cells.',
  },
  'definition-list': {
    why: 'Malformed definition lists lose their meaning for screen readers.',
    fix: 'Make sure <dl> contains only <dt>/<dd> groups (optionally wrapped in <div>).',
  },
  'autocomplete-valid': {
    why: 'Correct autocomplete values let browsers and assistive tools fill in personal details for people with motor or memory impairments.',
    fix: 'Use a valid autocomplete token that matches the field, such as "email", "given-name" or "postal-code".',
    example: '<input type="email" autocomplete="email">',
  },
  'blink': {
    why: 'Blinking content is distracting and can be hard to read.',
    fix: 'Remove the <blink> element.',
  },
  'marquee': {
    why: 'Scrolling text is hard to read and cannot be paused.',
    fix: 'Remove the <marquee> element and show the content statically.',
  },
  'server-side-image-map': {
    why: 'Server-side image maps cannot be used with a keyboard.',
    fix: 'Replace it with a client-side image map or regular links.',
  },
  'object-alt': {
    why: '<object> elements need a text alternative for screen readers.',
    fix: 'Add text inside the <object>, or an aria-label.',
  },
  'area-alt': {
    why: 'Clickable areas of an image map need text so users know where they go.',
    fix: 'Add an alt attribute to each <area>.',
  },
};

const IMPACT_ORDER = ['critical', 'serious', 'moderate', 'minor'];

// axe reports four impact levels; the app shows three severities.
const SEVERITY_ORDER = ['high', 'medium', 'low'];
const SEVERITY_FOR_IMPACT = { critical: 'high', serious: 'high', moderate: 'medium', minor: 'low' };

function getFix(violation) {
  const known = FIXES[violation.id];
  if (known) return { ...known, generic: false };
  return {
    why: violation.description,
    fix: violation.help + '. See the linked guidance for details.',
    generic: true,
  };
}

module.exports = { FIXES, IMPACT_ORDER, SEVERITY_ORDER, SEVERITY_FOR_IMPACT, getFix };
