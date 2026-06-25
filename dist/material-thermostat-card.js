function t(t,e,i,s){var a,r=arguments.length,o=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,s);else for(var n=t.length-1;n>=0;n--)(a=t[n])&&(o=(r<3?a(o):r>3?a(e,i,o):a(e,i))||o);return r>3&&o&&Object.defineProperty(e,i,o),o}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),a=new WeakMap;let r=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=a.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&a.set(e,t))}return t}toString(){return this.cssText}};const o=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new r(i,t,s)},n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,v=m.trustedTypes,g=v?v.emptyScript:"",f=m.reactiveElementPolyfillSupport,_=(t,e)=>t,y={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},b=(t,e)=>!l(t,e),$={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:b};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=$){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:a}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);a?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??$}static _$Ei(){if(this.hasOwnProperty(_("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(_("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_("properties"))){const t=this.properties,e=[...h(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),a=e.litNonce;void 0!==a&&s.setAttribute("nonce",a),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const a=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(e,i.type);this._$Em=t,null==a?this.removeAttribute(s):this.setAttribute(s,a),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),a="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:y;this._$Em=s;const r=a.fromAttribute(e,t.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(t,e,i,s=!1,a){if(void 0!==t){const r=this.constructor;if(!1===s&&(a=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??b)(a,e)||i.useDefault&&i.reflect&&a===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:a},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==a||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[_("elementProperties")]=new Map,x[_("finalized")]=new Map,f?.({ReactiveElement:x}),(m.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,k=t=>t,A=w.trustedTypes,S=A?A.createPolicy("lit-html",{createHTML:t=>t}):void 0,E="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,O="?"+C,P=`<${O}>`,z=document,H=()=>z.createComment(""),M=t=>null===t||"object"!=typeof t&&"function"!=typeof t,I=Array.isArray,T="[ \t\n\f\r]",D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,L=/-->/g,U=/>/g,j=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),R=/'/g,N=/"/g,V=/^(?:script|style|textarea|title)$/i,F=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),B=F(1),q=F(2),K=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),Y=new WeakMap,X=z.createTreeWalker(z,129);function J(t,e){if(!I(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,s=[];let a,r=2===e?"<svg>":3===e?"<math>":"",o=D;for(let e=0;e<i;e++){const i=t[e];let n,l,c=-1,d=0;for(;d<i.length&&(o.lastIndex=d,l=o.exec(i),null!==l);)d=o.lastIndex,o===D?"!--"===l[1]?o=L:void 0!==l[1]?o=U:void 0!==l[2]?(V.test(l[2])&&(a=RegExp("</"+l[2],"g")),o=j):void 0!==l[3]&&(o=j):o===j?">"===l[0]?(o=a??D,c=-1):void 0===l[1]?c=-2:(c=o.lastIndex-l[2].length,n=l[1],o=void 0===l[3]?j:'"'===l[3]?N:R):o===N||o===R?o=j:o===L||o===U?o=D:(o=j,a=void 0);const h=o===j&&t[e+1].startsWith("/>")?" ":"";r+=o===D?i+P:c>=0?(s.push(n),i.slice(0,c)+E+i.slice(c)+C+h):i+C+(-2===c?e:h)}return[J(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class G{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let a=0,r=0;const o=t.length-1,n=this.parts,[l,c]=Z(t,e);if(this.el=G.createElement(l,i),X.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=X.nextNode())&&n.length<o;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(E)){const e=c[r++],i=s.getAttribute(t).split(C),o=/([.?@])?(.*)/.exec(e);n.push({type:1,index:a,name:o[2],strings:i,ctor:"."===o[1]?st:"?"===o[1]?at:"@"===o[1]?rt:it}),s.removeAttribute(t)}else t.startsWith(C)&&(n.push({type:6,index:a}),s.removeAttribute(t));if(V.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=A?A.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],H()),X.nextNode(),n.push({type:2,index:++a});s.append(t[e],H())}}}else if(8===s.nodeType)if(s.data===O)n.push({type:2,index:a});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)n.push({type:7,index:a}),t+=C.length-1}a++}}static createElement(t,e){const i=z.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,s){if(e===K)return e;let a=void 0!==s?i._$Co?.[s]:i._$Cl;const r=M(e)?void 0:e._$litDirective$;return a?.constructor!==r&&(a?._$AO?.(!1),void 0===r?a=void 0:(a=new r(t),a._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=a:i._$Cl=a),void 0!==a&&(e=Q(t,a._$AS(t,e.values),a,s)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??z).importNode(e,!0);X.currentNode=s;let a=X.nextNode(),r=0,o=0,n=i[0];for(;void 0!==n;){if(r===n.index){let e;2===n.type?e=new et(a,a.nextSibling,this,t):1===n.type?e=new n.ctor(a,n.name,n.strings,this,t):6===n.type&&(e=new ot(a,this,t)),this._$AV.push(e),n=i[++o]}r!==n?.index&&(a=X.nextNode(),r++)}return X.currentNode=z,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),M(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==K&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>I(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&M(this._$AH)?this._$AA.nextSibling.data=t:this.T(z.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=G.createElement(J(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new tt(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=Y.get(t.strings);return void 0===e&&Y.set(t.strings,e=new G(t)),e}k(t){I(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const a of t)s===e.length?e.push(i=new et(this.O(H()),this.O(H()),this,this.options)):i=e[s],i._$AI(a),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class it{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,a){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=a,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(t,e=this,i,s){const a=this.strings;let r=!1;if(void 0===a)t=Q(this,t,e,0),r=!M(t)||t!==this._$AH&&t!==K,r&&(this._$AH=t);else{const s=t;let o,n;for(t=a[0],o=0;o<a.length-1;o++)n=Q(this,s[i+o],e,o),n===K&&(n=this._$AH[o]),r||=!M(n)||n!==this._$AH[o],n===W?t=W:t!==W&&(t+=(n??"")+a[o+1]),this._$AH[o]=n}r&&!s&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class at extends it{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class rt extends it{constructor(t,e,i,s,a){super(t,e,i,s,a),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??W)===K)return;const i=this._$AH,s=t===W&&i!==W||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,a=t!==W&&(i===W||s);s&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const nt=w.litHtmlPolyfillSupport;nt?.(G,et),(w.litHtmlVersions??=[]).push("3.3.3");const lt=globalThis;let ct=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let a=s._$litPart$;if(void 0===a){const t=i?.renderBefore??null;s._$litPart$=a=new et(e.insertBefore(H(),t),t,void 0,i??{})}return a._$AI(t),a})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return K}};ct._$litElement$=!0,ct.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ct});const dt=lt.litElementPolyfillSupport;dt?.({LitElement:ct}),(lt.litElementVersions??=[]).push("4.2.2");const ht=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:b},ut=(t=pt,e,i)=>{const{kind:s,metadata:a}=i;let r=globalThis.litPropertyMetadata.get(a);if(void 0===r&&globalThis.litPropertyMetadata.set(a,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const a=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,a,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const a=this[s];e.call(this,i),this.requestUpdate(s,a,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function mt(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function vt(t){return mt({...t,state:!0,attribute:!1})}var gt,ft;function _t(){return(_t=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var s in i)Object.prototype.hasOwnProperty.call(i,s)&&(t[s]=i[s])}return t}).apply(this,arguments)}!function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(gt||(gt={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(ft||(ft={}));var yt=function(t,e,i,s){s=s||{},i=null==i?{}:i;var a=new Event(e,{bubbles:void 0===s.bubbles||s.bubbles,cancelable:Boolean(s.cancelable),composed:void 0===s.composed||s.composed});return a.detail=i,t.dispatchEvent(a),a};const bt="material-thermostat-card",$t="material-thermostat-card-editor",xt=o`
  :host {
    --mt-primary: var(--md-sys-color-primary, var(--primary-color, #6750a4));
    --mt-on-primary: var(--md-sys-color-on-primary, #ffffff);
    --mt-primary-container: var(--md-sys-color-primary-container, rgba(103, 80, 164, 0.16));
    --mt-on-primary-container: var(--md-sys-color-on-primary-container, var(--primary-text-color, #21005d));

    --mt-surface: var(--md-sys-color-surface, var(--card-background-color, #fef7ff));
    --mt-surface-container: var(
      --md-sys-color-surface-container,
      var(--ha-card-background, var(--card-background-color, #f3edf7))
    );
    --mt-surface-container-high: var(--md-sys-color-surface-container-high, var(--mt-surface-container));
    --mt-surface-container-highest: var(
      --md-sys-color-surface-container-highest,
      var(--mt-surface-container-high)
    );

    --mt-on-surface: var(--md-sys-color-on-surface, var(--primary-text-color, #1c1b1f));
    --mt-on-surface-variant: var(--md-sys-color-on-surface-variant, var(--secondary-text-color, #49454f));

    --mt-secondary-container: var(--md-sys-color-secondary-container, rgba(103, 80, 164, 0.14));
    --mt-on-secondary-container: var(--md-sys-color-on-secondary-container, var(--primary-text-color, #1d192b));

    --mt-outline: var(--md-sys-color-outline, var(--divider-color, #79747e));
    --mt-outline-variant: var(--md-sys-color-outline-variant, var(--divider-color, #cac4d0));
    --mt-error: var(--md-sys-color-error, var(--error-color, #b3261e));

    /* Filled "selected" segment color (matches the stock card's accent). */
    --mt-selected-bg: var(--md-sys-color-primary, var(--primary-color, #6750a4));
    --mt-selected-fg: var(--md-sys-color-on-primary, #ffffff);

    --mt-shape-card: var(--md-sys-shape-corner-extra-large, 28px);
    --mt-shape-chip-square: var(--md-sys-shape-corner-large, 16px);
    --mt-shape-full: var(--md-sys-shape-corner-full, 9999px);

    /* State layer opacities per M3 spec. */
    --mt-state-hover: 0.08;
    --mt-state-pressed: 0.12;
  }
`,wt={off:"mdi:power",heat:"mdi:fire",cool:"mdi:snowflake",heat_cool:"mdi:sun-snowflake-variant",auto:"mdi:thermostat-auto",dry:"mdi:water-percent",fan_only:"mdi:fan"};function kt(t){switch(t){case"cool":return"var(--state-climate-cool-color, #2b9af9)";case"heat":return"var(--state-climate-heat-color, #ff8100)";case"heat_cool":return"var(--state-climate-heat_cool-color, #009688)";case"auto":return"var(--state-climate-auto-color, #e5c454)";case"dry":return"var(--state-climate-dry-color, #efbd07)";case"fan_only":return"var(--state-climate-fan_only-color, #8a8a8a)";default:return"var(--state-climate-off-color, var(--mt-on-surface-variant))"}}function At(t){return"heat_cool"===t?"Heat/Cool":t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}const St=132,Et=225;function Ct(t,e){const i=(t-90)*Math.PI/180;return{x:160+e*Math.cos(i),y:160+e*Math.sin(i)}}function Ot(t,e,i){const s=Ct(t,i),a=Ct(e,i),r=e-t>180?1:0;return`M ${s.x} ${s.y} A ${i} ${i} 0 ${r} 1 ${a.x} ${a.y}`}let Pt=class extends ct{constructor(){super(...arguments),this.value=20,this.min=7,this.max=35,this.step=.5,this.mode="off",this.modeLabel="",this.unit="°C",this.showCurrentAsPrimary=!1,this.disabled=!1,this.dual=!1,this._dragging=!1,this._dragValue=0,this._dragLow=0,this._dragHigh=0,this._activeHandle=null,this._onPointerDown=t=>{if(this.disabled)return;t.preventDefault(),this._svg.setPointerCapture(t.pointerId),this._dragging=!0;const e=this._valueFromPoint(t.clientX,t.clientY);this.dual?(this._dragLow=this._displayLow,this._dragHigh=this._displayHigh,this._activeHandle=Math.abs(e-this._dragLow)<=Math.abs(e-this._dragHigh)?"low":"high",this._applyDual(e),this._emit("value-changing",{low:this._dragLow,high:this._dragHigh})):(this._dragValue=e,this._emit("value-changing",{value:e}))},this._onPointerMove=t=>{if(!this._dragging)return;const e=this._valueFromPoint(t.clientX,t.clientY);this.dual?(this._applyDual(e),this._emit("value-changing",{low:this._dragLow,high:this._dragHigh})):e!==this._dragValue&&(this._dragValue=e,this._emit("value-changing",{value:e}))},this._onPointerUp=t=>{this._dragging&&(this._svg.releasePointerCapture(t.pointerId),this._dragging=!1,this.dual?(this._emit("value-changed",{low:this._dragLow,high:this._dragHigh}),this._activeHandle=null):this._emit("value-changed",{value:this._dragValue}))},this._onKeyDown=t=>{if(this.disabled||this.dual)return;let e;"ArrowUp"===t.key||"ArrowRight"===t.key?e=this.value+this.step:"ArrowDown"!==t.key&&"ArrowLeft"!==t.key||(e=this.value-this.step),void 0!==e&&(t.preventDefault(),this._emit("value-changed",{value:this._roundToStep(e)}))}}get _precision(){return this.step<1?1:0}get _displayValue(){return this._dragging?this._dragValue:this.value}get _displayLow(){return this._dragging?this._dragLow:this.lowValue??this.min}get _displayHigh(){return this._dragging?this._dragHigh:this.highValue??this.max}_angleOf(t){const e=(t-this.min)/(this.max-this.min||1);return Et+270*Math.min(1,Math.max(0,e))}_roundToStep(t){const e=Math.min(this.max,Math.max(this.min,t)),i=Math.round(e/this.step)*this.step;return parseFloat(i.toFixed(this._precision))}_valueFromPoint(t,e){const i=this._svg.getBoundingClientRect(),s=i.left+i.width/2,a=i.top+i.height/2;let r,o=180*Math.atan2(e-a,t-s)/Math.PI+90;o=(o%360+360)%360,r=o>=Et?o-Et:o<=135?o+360-Et:o<180?270:0;const n=Math.min(1,Math.max(0,r/270));return this._roundToStep(this.min+n*(this.max-this.min))}_applyDual(t){"low"===this._activeHandle?this._dragLow=Math.min(t,this._dragHigh-this.step):this._dragHigh=Math.max(t,this._dragLow+this.step)}_step(t){this.disabled||this._emit("value-changed",{value:this._roundToStep(this.value+t*this.step)})}_emit(t,e){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}_fmt(t,e){return null==t||Number.isNaN(t)?"—":t.toFixed(e)}render(){const t=kt(this.mode),e=null!=this.current&&this.current>=this.min&&this.current<=this.max?Ct(this._angleOf(this.current),St):null;return B`
      <div class="dial" style=${`--dial-color: ${t}`}>
        <svg
          viewBox="0 0 ${320} ${320}"
          role="slider"
          tabindex=${this.disabled?-1:0}
          aria-valuemin=${this.min}
          aria-valuemax=${this.max}
          aria-valuenow=${this.dual?this._displayHigh:this._displayValue}
          aria-label="Target temperature"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
          @keydown=${this._onKeyDown}
        >
          <path
            class="track"
            d=${Ot(Et,495,St)}
            stroke-width=${16}
          />
          ${this.dual?this._renderDualArc():this._renderSingleArc()}
          ${e?q`<circle class="current-dot" cx=${e.x} cy=${e.y} r="4" />`:W}
          ${this.dual?this._renderDualHandles():this._renderSingleHandle()}
        </svg>

        ${this.dual?this._renderDualCenter():this._renderSingleCenter()}
        ${this.dual?W:this._renderAdjust()}
      </div>
    `}_renderSingleArc(){return q`<path class="value" d=${Ot(Et,this._angleOf(this._displayValue),St)} stroke-width=${16} />`}_renderDualArc(){return q`<path class="value" d=${Ot(this._angleOf(this._displayLow),this._angleOf(this._displayHigh),St)} stroke-width=${16} />`}_renderSingleHandle(){const t=Ct(this._angleOf(this._displayValue),St);return q`<circle class="handle" cx=${t.x} cy=${t.y} r="13" />`}_renderDualHandles(){const t=Ct(this._angleOf(this._displayLow),St),e=Ct(this._angleOf(this._displayHigh),St);return q`
      <circle class="handle" cx=${t.x} cy=${t.y} r="13" />
      <circle class="handle" cx=${e.x} cy=${e.y} r="13" />
    `}_renderSingleCenter(){const t=this._displayValue,e=this.showCurrentAsPrimary&&null!=this.current?this.current:t,i=this.showCurrentAsPrimary?t:this.current,s=this.showCurrentAsPrimary?1:this._precision,a=this.showCurrentAsPrimary?this._precision:1,r=this.showCurrentAsPrimary?"mdi:thermostat":"mdi:thermometer";return B`
      <div class="center">
        ${this.modeLabel?B`<div class="mode">${this.modeLabel}</div>`:W}
        <div class="temp">
          <span class="value-text">${this._fmt(e,s)}</span>
          <span class="unit">${this.unit}</span>
        </div>
        ${null!=i?B`<div class="sub">
              <ha-icon icon=${r}></ha-icon>
              <span>${this._fmt(i,a)} ${this.unit}</span>
            </div>`:W}
      </div>
    `}_renderDualCenter(){return B`
      <div class="center">
        ${this.modeLabel?B`<div class="mode">${this.modeLabel}</div>`:W}
        <div class="temp dual">
          <span class="value-text">${this._fmt(this._displayLow,this._precision)}</span>
          <span class="dash">–</span>
          <span class="value-text">${this._fmt(this._displayHigh,this._precision)}</span>
          <span class="unit">${this.unit}</span>
        </div>
        ${null!=this.current?B`<div class="sub">
              <ha-icon icon="mdi:thermometer"></ha-icon>
              <span>${this._fmt(this.current,1)} ${this.unit}</span>
            </div>`:W}
      </div>
    `}_renderAdjust(){return B`
      <div class="adjust">
        <button
          class="step"
          aria-label="Decrease temperature"
          ?disabled=${this.disabled}
          @click=${()=>this._step(-1)}
        >
          <ha-icon icon="mdi:minus"></ha-icon>
        </button>
        <button
          class="step"
          aria-label="Increase temperature"
          ?disabled=${this.disabled}
          @click=${()=>this._step(1)}
        >
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
      </div>
    `}};Pt.styles=[xt,o`
      :host {
        display: block;
      }
      .dial {
        position: relative;
        width: 100%;
        max-width: 320px;
        margin: 0 auto;
        aspect-ratio: 1 / 1;
      }
      svg {
        width: 100%;
        height: 100%;
        touch-action: none;
        outline: none;
      }
      svg:focus-visible .handle {
        stroke: var(--mt-on-surface);
        stroke-width: 3;
      }
      .track {
        fill: none;
        stroke: var(--mt-outline-variant);
        stroke-linecap: round;
        opacity: 0.5;
      }
      .value {
        fill: none;
        stroke: var(--dial-color);
        stroke-linecap: round;
        transition:
          stroke 240ms cubic-bezier(0.2, 0, 0, 1),
          d 120ms linear;
      }
      .current-dot {
        fill: var(--mt-on-surface-variant);
      }
      .handle {
        fill: #fff;
        stroke: var(--dial-color);
        stroke-width: 2;
        filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3));
        cursor: grab;
        transition: stroke 240ms cubic-bezier(0.2, 0, 0, 1);
      }
      .center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        pointer-events: none;
        color: var(--mt-on-surface);
      }
      .mode {
        font-size: var(--md-sys-typescale-title-medium-size, 16px);
        color: var(--mt-on-surface-variant);
        font-weight: 500;
      }
      .temp {
        display: flex;
        align-items: flex-start;
        line-height: 1;
      }
      .temp.dual {
        align-items: center;
        gap: 6px;
      }
      .temp.dual .value-text {
        font-size: var(--md-sys-typescale-display-small-size, 40px);
      }
      .temp.dual .dash {
        font-size: var(--md-sys-typescale-display-small-size, 40px);
        color: var(--mt-on-surface-variant);
      }
      .value-text {
        font-size: var(--md-sys-typescale-display-large-size, 64px);
        font-weight: 400;
        letter-spacing: -0.02em;
      }
      .unit {
        font-size: var(--md-sys-typescale-title-large-size, 22px);
        margin-top: 0.4em;
        margin-left: 2px;
        color: var(--mt-on-surface-variant);
      }
      .temp.dual .unit {
        margin-top: 0;
        align-self: center;
      }
      .sub {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--mt-on-surface-variant);
        font-size: var(--md-sys-typescale-body-large-size, 16px);
      }
      .sub ha-icon {
        --mdc-icon-size: 18px;
      }
      .adjust {
        position: absolute;
        left: 50%;
        bottom: 6%;
        transform: translateX(-50%);
        display: flex;
        gap: 16px;
      }
      .step {
        width: 48px;
        height: 48px;
        border-radius: var(--mt-shape-full);
        border: none;
        background: var(--mt-surface-container-high);
        color: var(--mt-on-surface);
        display: grid;
        place-items: center;
        cursor: pointer;
        transition:
          background-color 180ms cubic-bezier(0.2, 0, 0, 1),
          transform 120ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .step ha-icon {
        --mdc-icon-size: 24px;
      }
      .step:hover:not([disabled]) {
        background: color-mix(in srgb, var(--mt-on-surface) 8%, var(--mt-surface-container-high));
      }
      .step:active:not([disabled]) {
        transform: scale(0.92);
        background: color-mix(in srgb, var(--mt-on-surface) 12%, var(--mt-surface-container-high));
      }
      .step[disabled] {
        opacity: 0.38;
        cursor: default;
      }
    `],t([mt({type:Number})],Pt.prototype,"value",void 0),t([mt({type:Number})],Pt.prototype,"min",void 0),t([mt({type:Number})],Pt.prototype,"max",void 0),t([mt({type:Number})],Pt.prototype,"step",void 0),t([mt({type:Number})],Pt.prototype,"current",void 0),t([mt()],Pt.prototype,"mode",void 0),t([mt()],Pt.prototype,"modeLabel",void 0),t([mt()],Pt.prototype,"unit",void 0),t([mt({type:Boolean})],Pt.prototype,"showCurrentAsPrimary",void 0),t([mt({type:Boolean})],Pt.prototype,"disabled",void 0),t([mt({type:Boolean})],Pt.prototype,"dual",void 0),t([mt({type:Number})],Pt.prototype,"lowValue",void 0),t([mt({type:Number})],Pt.prototype,"highValue",void 0),t([vt()],Pt.prototype,"_dragging",void 0),t([vt()],Pt.prototype,"_dragValue",void 0),t([vt()],Pt.prototype,"_dragLow",void 0),t([vt()],Pt.prototype,"_dragHigh",void 0),t([vt()],Pt.prototype,"_activeHandle",void 0),t([(t,e,i)=>((t,e,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof e&&Object.defineProperty(t,e,i),i))(t,e,{get(){return t=this,t.renderRoot?.querySelector("svg")??null;var t}})],Pt.prototype,"_svg",void 0),Pt=t([ht("mt-circular-dial")],Pt);class zt{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}const Ht=(Mt=class extends zt{constructor(t){if(super(t),1!==t.type||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(e=>t[e]).join(" ")+" "}update(t,[e]){if(void 0===this.st){this.st=new Set,void 0!==t.strings&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter(t=>""!==t)));for(const t in e)e[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(e)}const i=t.element.classList;for(const t of this.st)t in e||(i.remove(t),this.st.delete(t));for(const t in e){const s=!!e[t];s===this.st.has(t)||this.nt?.has(t)||(s?(i.add(t),this.st.add(t)):(i.remove(t),this.st.delete(t)))}return K}},(...t)=>({_$litDirective$:Mt,values:t}));var Mt;let It=class extends ct{constructor(){super(...arguments),this.items=[],this.placeholder="",this._open=!1,this._up=!1,this._onDocClick=t=>{this._open&&!t.composedPath().includes(this)&&(this._open=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocClick)}get _active(){return this.items.find(t=>t.active)??this.items[0]}_toggle(t){if(t.stopPropagation(),!this._open){const t=this.getBoundingClientRect();this._up=t.bottom>.55*window.innerHeight}this._open=!this._open}_select(t,e){t.stopPropagation(),this._open=!1,this.dispatchEvent(new CustomEvent("item-selected",{detail:{value:e}}))}render(){const t=this._active;return B`
      <button
        class=${Ht({trigger:!0,open:this._open})}
        aria-haspopup="listbox"
        aria-expanded=${this._open?"true":"false"}
        @click=${this._toggle}
      >
        ${t?.icon?B`<ha-icon class="lead" icon=${t.icon}></ha-icon>`:B`<span class="dot"></span>`}
        <span class="label">${t?.label??this.placeholder}</span>
        <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
      </button>
      ${this._open?B`<div class=${Ht({menu:!0,up:this._up})} role="listbox">
            ${this.items.map(t=>B`<button
                class=${Ht({opt:!0,active:!!t.active})}
                role="option"
                aria-selected=${t.active?"true":"false"}
                @click=${e=>this._select(e,t.value)}
              >
                ${t.icon?B`<ha-icon icon=${t.icon}></ha-icon>`:B`<span class="dot"></span>`}
                <span class="label">${t.label}</span>
                ${t.active?B`<ha-icon class="check" icon="mdi:check"></ha-icon>`:W}
              </button>`)}
          </div>`:W}
    `}};It.styles=[xt,o`
      :host {
        position: relative;
        display: block;
        width: 100%;
      }
      .trigger {
        width: 100%;
        height: 48px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 16px;
        border: none;
        border-radius: var(--mt-shape-full);
        background: var(--mt-surface-container);
        color: var(--mt-on-surface);
        cursor: pointer;
        font: inherit;
        transition: background-color 180ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .trigger:hover {
        background: color-mix(in srgb, var(--mt-on-surface) 6%, var(--mt-surface-container));
      }
      .trigger .label {
        flex: 1;
        text-align: left;
        font-size: var(--md-sys-typescale-body-large-size, 16px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .trigger .lead {
        --mdc-icon-size: 22px;
        color: var(--mt-on-surface-variant);
      }
      .trigger .chev {
        --mdc-icon-size: 24px;
        color: var(--mt-on-surface-variant);
        transition: transform 200ms cubic-bezier(0.2, 0, 0, 1);
      }
      .trigger.open .chev {
        transform: rotate(180deg);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--mt-on-surface-variant);
        flex: 0 0 auto;
      }
      .menu {
        position: absolute;
        left: 0;
        right: 0;
        top: calc(100% + 6px);
        z-index: 20;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 6px;
        background: var(--mt-surface-container-high);
        border-radius: 20px;
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.3),
          0 1px 3px rgba(0, 0, 0, 0.2);
        max-height: 280px;
        overflow-y: auto;
        animation: mt-pop 130ms cubic-bezier(0.2, 0, 0, 1);
      }
      .menu.up {
        top: auto;
        bottom: calc(100% + 6px);
      }
      .opt {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 10px 12px;
        border: none;
        background: transparent;
        color: var(--mt-on-surface);
        border-radius: var(--mt-shape-full);
        cursor: pointer;
        font: inherit;
        text-align: left;
      }
      .opt .label {
        flex: 1;
        white-space: nowrap;
      }
      .opt ha-icon {
        --mdc-icon-size: 22px;
      }
      .opt:hover {
        background: color-mix(in srgb, var(--mt-on-surface) 8%, transparent);
      }
      .opt.active {
        background: var(--mt-secondary-container);
        color: var(--mt-on-secondary-container);
      }
      .opt .check {
        --mdc-icon-size: 20px;
        color: var(--mt-on-secondary-container);
      }
      @keyframes mt-pop {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    `],t([mt({attribute:!1})],It.prototype,"items",void 0),t([mt()],It.prototype,"placeholder",void 0),t([vt()],It.prototype,"_open",void 0),t([vt()],It.prototype,"_up",void 0),It=t([ht("mt-dropdown")],It);let Tt=class extends ct{constructor(){super(...arguments),this.items=[],this.display="icons"}_select(t){this.dispatchEvent(new CustomEvent("item-selected",{detail:{value:t},bubbles:!0,composed:!0}))}render(){return this.items.length?"dropdown"===this.display?this._renderDropdown():this._renderIcons():W}_renderIcons(){return B`
      <div class="row">
        ${this.label?B`<span class="row-label">${this.label}</span>`:W}
        <div class="chips" role="group" aria-label=${this.label??"options"}>
          ${this.items.map(t=>B`
              <button
                class=${Ht({chip:!0,active:!!t.active})}
                ?disabled=${t.disabled}
                title=${t.label}
                aria-label=${t.label}
                aria-pressed=${t.active?"true":"false"}
                @click=${()=>this._select(t.value)}
              >
                ${t.icon?B`<ha-icon icon=${t.icon}></ha-icon>`:B`<span class="chip-text">${t.label}</span>`}
              </button>
            `)}
        </div>
      </div>
    `}_renderDropdown(){return B`<mt-dropdown
      .items=${this.items}
      .placeholder=${this.label??""}
      @item-selected=${t=>this._select(t.detail.value)}
    ></mt-dropdown>`}};Tt.styles=[xt,o`
      :host {
        display: block;
        width: 100%;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
      }
      .row-label {
        color: var(--mt-on-surface-variant);
        font-size: var(--md-sys-typescale-label-large-size, 14px);
        white-space: nowrap;
      }
      .chips {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
        padding: 4px;
        background: var(--mt-surface-container);
        border-radius: var(--mt-shape-full);
      }
      .chip {
        flex: 1;
        height: 44px;
        min-width: 44px;
        display: grid;
        place-items: center;
        border: none;
        border-radius: var(--mt-shape-full);
        background: transparent;
        color: var(--mt-on-surface-variant);
        cursor: pointer;
        padding: 0 8px;
        transition:
          background-color 180ms cubic-bezier(0.2, 0, 0, 1),
          color 180ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .chip ha-icon {
        --mdc-icon-size: 24px;
      }
      .chip-text {
        font-size: var(--md-sys-typescale-label-large-size, 14px);
        font-weight: 500;
        white-space: nowrap;
      }
      .chip:hover:not(.active):not([disabled]) {
        background: color-mix(in srgb, var(--mt-on-surface) 8%, transparent);
      }
      .chip:active:not([disabled]) {
        background: color-mix(in srgb, var(--mt-on-surface) 12%, transparent);
      }
      .chip.active {
        background: var(--mt-selected-bg, var(--mt-primary));
        color: var(--mt-selected-fg, var(--mt-on-primary));
      }
      .chip[disabled] {
        opacity: 0.38;
        cursor: default;
      }
    `],t([mt({attribute:!1})],Tt.prototype,"items",void 0),t([mt()],Tt.prototype,"display",void 0),t([mt()],Tt.prototype,"label",void 0),Tt=t([ht("mt-selector-row")],Tt);let Dt=class extends ct{constructor(){super(...arguments),this.kind="hvac",this.display="icons"}get _stateObj(){return this.hass?.states?.[this.entityId]}_overrideMap(){const t=new Map;return(this.options??[]).forEach(e=>t.set(e.value,e)),t}_build(){const t=this._stateObj;if(!t)return[];const e=this._overrideMap();let i,s,a=[];return"hvac"===this.kind?(a=t.attributes.hvac_modes??[],i=t.state,s=t=>wt[t]??"mdi:thermostat"):"fan"===this.kind?(a=t.attributes.fan_modes??[],i=t.attributes.fan_mode,s=t=>function(t){const e=t.toLowerCase();return e.includes("auto")?"mdi:fan-auto":e.includes("off")||"0"===e?"mdi:fan-off":/(^|[^0-9])1([^0-9]|$)|low|min|quiet|silent/.test(e)?"mdi:fan-speed-1":/(^|[^0-9])2([^0-9]|$)|mid|med/.test(e)?"mdi:fan-speed-2":/(^|[^0-9])3([^0-9]|$)|high|max|strong|turbo/.test(e)?"mdi:fan-speed-3":"mdi:fan"}(t)):(a=t.attributes.swing_modes??[],i=t.attributes.swing_mode,s=t=>function(t){const e=t.toLowerCase();return"off"===e||"stop"===e||"fixed"===e?"mdi:arrow-expand-vertical":"both"===e||"on"===e||"full"===e?"mdi:arrow-all":e.includes("horizontal")?"mdi:arrow-left-right":e.includes("vertical")?"mdi:arrow-up-down":"mdi:swap-vertical"}(t)),a.filter(t=>!e.get(t)?.hide).map(t=>({value:t,label:e.get(t)?.label??At(t),icon:e.get(t)?.icon??s(t),active:t===i}))}_onSelect(t){const e=t.detail.value;if(!this._stateObj)return;const i=this.entityId;"hvac"===this.kind?this.hass.callService("climate","set_hvac_mode",{entity_id:i,hvac_mode:e}):"fan"===this.kind?this.hass.callService("climate","set_fan_mode",{entity_id:i,fan_mode:e}):this.hass.callService("climate","set_swing_mode",{entity_id:i,swing_mode:e})}render(){const t=this._build();return t.length?B`
      <mt-selector-row
        .items=${t}
        display=${this.display}
        @item-selected=${this._onSelect}
      ></mt-selector-row>
    `:W}};t([mt({attribute:!1})],Dt.prototype,"hass",void 0),t([mt()],Dt.prototype,"entityId",void 0),t([mt()],Dt.prototype,"kind",void 0),t([mt()],Dt.prototype,"display",void 0),t([mt({attribute:!1})],Dt.prototype,"options",void 0),Dt=t([ht("mt-climate-selector")],Dt);let Lt=class extends ct{constructor(){super(...arguments),this.display="icons"}get _stateObj(){return this.hass?.states?.[this.entity]}_overrideMap(){const t=new Map;return(this.options??[]).forEach(e=>t.set(e.value,e)),t}_build(){const t=this._stateObj;if(!t)return[];const e=this._overrideMap();return(t.attributes.options??[]).filter(t=>!e.get(t)?.hide).map(i=>({value:i,label:e.get(i)?.label??At(i),icon:e.get(i)?.icon,active:i===t.state}))}_onSelect(t){this._stateObj&&this.hass.callService("input_select","select_option",{entity_id:this.entity,option:t.detail.value})}render(){const t=this._build();return t.length?B`<mt-selector-row
      .items=${t}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:W}};t([mt({attribute:!1})],Lt.prototype,"hass",void 0),t([mt()],Lt.prototype,"entity",void 0),t([mt()],Lt.prototype,"display",void 0),t([mt()],Lt.prototype,"label",void 0),t([mt({attribute:!1})],Lt.prototype,"options",void 0),Lt=t([ht("mt-input-select")],Lt);let Ut=class extends ct{constructor(){super(...arguments),this.entities=[],this.display="icons"}_build(){return(this.entities??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon,active:"on"===e?.state,disabled:!e||"unavailable"===e.state}})}async _onSelect(t){const e=t.detail.value,i=(this.entities??[]).map(t=>t.entity).filter(t=>t&&t!==e&&"on"===this.hass.states[t]?.state);i.length&&await this.hass.callService("homeassistant","turn_off",{entity_id:i}),await this.hass.callService("homeassistant","turn_on",{entity_id:e})}render(){const t=this._build();return t.length?B`<mt-selector-row
      .items=${t}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:W}};t([mt({attribute:!1})],Ut.prototype,"hass",void 0),t([mt({attribute:!1})],Ut.prototype,"entities",void 0),t([mt()],Ut.prototype,"display",void 0),t([mt()],Ut.prototype,"label",void 0),Ut=t([ht("mt-switch-group")],Ut);let jt=class extends ct{constructor(){super(...arguments),this.entities=[]}_build(){return(this.entities??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon??"mdi:toggle-switch-variant",active:"on"===e?.state,disabled:!e||"unavailable"===e.state}})}_onSelect(t){this.hass.callService("homeassistant","toggle",{entity_id:t.detail.value})}render(){const t=this._build();return t.length?B`<mt-selector-row
      .items=${t}
      display="icons"
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:W}};function Rt(t,e,i){switch(i.split(".")[0]){case"button":e.callService("button","press",{entity_id:i});break;case"input_button":e.callService("input_button","press",{entity_id:i});break;case"scene":e.callService("scene","turn_on",{entity_id:i});break;case"script":e.callService("script","turn_on",{entity_id:i});break;case"switch":case"light":case"fan":case"input_boolean":e.callService("homeassistant","toggle",{entity_id:i});break;default:yt(t,"hass-more-info",{entityId:i})}}t([mt({attribute:!1})],jt.prototype,"hass",void 0),t([mt({attribute:!1})],jt.prototype,"entities",void 0),t([mt()],jt.prototype,"label",void 0),jt=t([ht("mt-switch-list")],jt);let Nt=class extends ct{constructor(){super(...arguments),this.items=[]}_build(){return(this.items??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon??"mdi:gesture-tap-button",active:!1,disabled:!e||"unavailable"===e.state}})}_onSelect(t){Rt(this,this.hass,t.detail.value)}render(){const t=this._build();return t.length?B`<mt-selector-row
      .items=${t}
      display="icons"
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:W}};t([mt({attribute:!1})],Nt.prototype,"hass",void 0),t([mt({attribute:!1})],Nt.prototype,"items",void 0),t([mt()],Nt.prototype,"label",void 0),Nt=t([ht("mt-button-list")],Nt);const Vt={sensor:"mdi:gauge",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb",fan:"mdi:fan",button:"mdi:gesture-tap-button",input_button:"mdi:gesture-tap-button",scene:"mdi:palette",script:"mdi:script-text"};let Ft=class extends ct{constructor(){super(...arguments),this._tap=()=>{this.config.entity&&function(t,e,i,s){const a=s??{action:"default"};switch(a.action){case"none":return;case"more-info":return void yt(t,"hass-more-info",{entityId:a.entity??i});case"toggle":return void e.callService("homeassistant","toggle",{entity_id:i});case"url":return void(a.url_path&&window.open(a.url_path));case"navigate":return void(a.navigation_path&&(window.history.pushState(null,"",a.navigation_path),yt(t,"location-changed",{replace:!1})));case"call-service":case"perform-action":{const t=a.perform_action??a.service;if(!t||!t.includes("."))return;const[i,s]=t.split(".");return void e.callService(i,s,a.data??a.service_data??{},a.target)}default:Rt(t,e,i)}}(this,this.hass,this.config.entity,this.config.tap_action)}}get _stateObj(){return this.hass?.states?.[this.config.entity]}get _isOn(){return"on"===this._stateObj?.state}_secondary(){const t=this._stateObj;if(!t)return;const e=this.config.entity.split(".")[0];if("sensor"===e){const e=t.attributes.unit_of_measurement;return e?`${t.state} ${e}`:t.state}return["switch","light","fan","input_boolean","binary_sensor"].includes(e)?this._isOn?"On":"Off":["button","input_button","scene","script"].includes(e)?void 0:t.state}render(){if(!this.config?.entity)return W;const t=this._stateObj,e=this.config.entity.split(".")[0],i=this.config.name??t?.attributes.friendly_name??this.config.entity,s=this.config.icon??t?.attributes.icon??Vt[e]??"mdi:eye",a=this._secondary();return B`
      <button class="tile" @click=${this._tap} aria-label=${i}>
        <div class="ic ${this._isOn?"on":""}"><ha-icon icon=${s}></ha-icon></div>
        <div class="text">
          <div class="title">${i}</div>
          ${a?B`<div class="sub">${a}</div>`:W}
        </div>
      </button>
    `}};Ft.styles=[xt,o`
      :host {
        display: block;
      }
      .tile {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px 16px;
        border: none;
        border-radius: var(--mt-shape-chip-square);
        background: var(--mt-surface-container);
        color: var(--mt-on-surface);
        cursor: pointer;
        text-align: left;
        min-height: 56px;
        transition: background-color 180ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .tile:hover {
        background: color-mix(in srgb, var(--mt-on-surface) 6%, var(--mt-surface-container));
      }
      .tile:active {
        background: color-mix(in srgb, var(--mt-on-surface) 12%, var(--mt-surface-container));
      }
      .ic {
        flex: 0 0 auto;
        width: 40px;
        height: 40px;
        border-radius: var(--mt-shape-full);
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--mt-on-surface-variant) 14%, transparent);
        color: var(--mt-on-surface-variant);
        transition:
          background-color 180ms cubic-bezier(0.2, 0, 0, 1),
          color 180ms cubic-bezier(0.2, 0, 0, 1);
      }
      .ic.on {
        background: var(--mt-selected-bg);
        color: var(--mt-selected-fg);
      }
      .ic ha-icon {
        --mdc-icon-size: 22px;
      }
      .text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .title {
        font-size: var(--md-sys-typescale-body-large-size, 16px);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .sub {
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        color: var(--mt-on-surface-variant);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `],t([mt({attribute:!1})],Ft.prototype,"hass",void 0),t([mt({attribute:!1})],Ft.prototype,"config",void 0),Ft=t([ht("mt-entity-tile")],Ft);let Bt=class extends ct{render(){const t=this.feature;switch(t.type){case"climate-hvac-modes":case"climate-fan-modes":case"climate-swing-modes":{const e="climate-hvac-modes"===t.type?"hvac":"climate-fan-modes"===t.type?"fan":"swing";return B`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind=${e}
          display=${t.display??"icons"}
          .options=${t.options}
        ></mt-climate-selector>`}case"input-select":return B`<mt-input-select
          .hass=${this.hass}
          entity=${t.entity}
          display=${t.display??"icons"}
          .label=${t.label}
          .options=${t.options}
        ></mt-input-select>`;case"switch-group":return B`<mt-switch-group
          .hass=${this.hass}
          .entities=${t.entities}
          display=${t.display??"icons"}
          .label=${t.label}
        ></mt-switch-group>`;case"switch-list":return B`<mt-switch-list
          .hass=${this.hass}
          .entities=${t.entities}
          .label=${t.label}
        ></mt-switch-list>`;case"button-list":return B`<mt-button-list
          .hass=${this.hass}
          .items=${t.items}
          .label=${t.label}
        ></mt-button-list>`;case"entity-tile":return B`<mt-entity-tile .hass=${this.hass} .config=${t}></mt-entity-tile>`;default:return W}}};Bt.styles=o`
    :host {
      display: block;
      width: 100%;
    }
  `,t([mt({attribute:!1})],Bt.prototype,"hass",void 0),t([mt()],Bt.prototype,"entityId",void 0),t([mt({attribute:!1})],Bt.prototype,"feature",void 0),Bt=t([ht("mt-feature-row")],Bt),console.info("%c MATERIAL-THERMOSTAT-CARD %c v0.1.2 ","color: white; background: #6750a4; font-weight: 700;","color: #6750a4; background: white; font-weight: 700;"),window.customCards=window.customCards||[],window.customCards.push({type:bt,name:"Material Thermostat Card",description:"A Material 3 Expressive thermostat card with customizable selectors and Nest/Google Home inspired UI.",preview:!0,documentationURL:"https://github.com/lageorgem/ha-material-thermostat-card"});let qt=class extends ct{static async getConfigElement(){return await Promise.resolve().then(function(){return ae}),document.createElement($t)}static getStubConfig(t){const e=Object.keys(t.states).find(t=>t.startsWith("climate."))??"";return{type:`custom:${bt}`,entity:e,features:[{type:"climate-hvac-modes"}]}}setConfig(t){if(!t.entity||"climate"!==t.entity.split(".")[0])throw new Error("You must specify a climate entity.");this._config=t}getCardSize(){return 7+(this._config?.features?.length??0)}get _stateObj(){return this.hass?.states?.[this._config?.entity]}_trackedEntityIds(){const t=new Set([this._config.entity]);for(const e of this._config.features??[])"entity"in e&&e.entity&&t.add(e.entity),"entities"in e&&e.entities?.forEach(e=>t.add(e.entity)),"items"in e&&e.items?.forEach(e=>t.add(e.entity));return[...t]}shouldUpdate(t){if(t.has("_config")||t.has("_selectedTemp"))return!0;if(!this._config)return!1;if(t.has("hass")){const e=t.get("hass");return!e||this._trackedEntityIds().some(t=>e.states[t]!==this.hass.states[t])}return!1}updated(t){if(t.has("hass")||t.has("_config")){const e=t.get("hass");!this._config?.theme||e&&e.themes===this.hass.themes&&!t.has("_config")||function(t,e,i,s){void 0===s&&(s=!1),t._themes||(t._themes={});var a=e.default_theme;("default"===i||i&&e.themes[i])&&(a=i);var r=_t({},t._themes);if("default"!==a){var o=e.themes[a];Object.keys(o).forEach(function(e){var i="--"+e;t._themes[i]="",r[i]=o[e]})}if(t.updateStyles?t.updateStyles(r):window.ShadyCSS&&window.ShadyCSS.styleSubtree(t,r),s){var n=document.querySelector("meta[name=theme-color]");if(n){n.hasAttribute("default-content")||n.setAttribute("default-content",n.getAttribute("content"));var l=r["--primary-color"]||n.getAttribute("default-content");n.setAttribute("content",l)}}}(this,this.hass.themes,this._config.theme)}if(t.has("hass")){const t=this._stateObj?.attributes;null!=this._selectedTemp&&t?.temperature===this._selectedTemp&&(this._selectedTemp=void 0),null!=this._selectedLow&&t?.target_temp_low===this._selectedLow&&(this._selectedLow=void 0),null!=this._selectedHigh&&t?.target_temp_high===this._selectedHigh&&(this._selectedHigh=void 0)}}get _isDual(){const t=this._stateObj?.attributes;return"heat_cool"===this._stateObj?.state&&null!=t?.target_temp_low&&null!=t?.target_temp_high}get _targetTemp(){return this._selectedTemp??this._stateObj?.attributes.temperature}get _targetLow(){return this._selectedLow??this._stateObj?.attributes.target_temp_low}get _targetHigh(){return this._selectedHigh??this._stateObj?.attributes.target_temp_high}_scheduleCommit(){this._debounceTimer&&window.clearTimeout(this._debounceTimer),this._debounceTimer=window.setTimeout(()=>{const t={entity_id:this._config.entity};this._isDual?(t.target_temp_low=this._targetLow,t.target_temp_high=this._targetHigh):t.temperature=this._targetTemp,this.hass.callService("climate","set_temperature",t)},600)}_onChanging(t){const{value:e,low:i,high:s}=t.detail;null!=i||null!=s?(this._selectedLow=i,this._selectedHigh=s):this._selectedTemp=e}_onChanged(t){this._onChanging(t),this._scheduleCommit()}_showMoreInfo(){yt(this,"hass-more-info",{entityId:this._config.entity})}_colorMode(){const t=this._stateObj?.attributes;switch(t?.hvac_action){case"cooling":return"cool";case"heating":return"heat";case"drying":return"dry";case"fan":return"fan_only";default:return this._stateObj?.state??"off"}}render(){if(!this._config||!this.hass)return B``;const t=this._stateObj;if(!t)return B`<ha-card
        ><div class="error">Entity not found: ${this._config.entity}</div></ha-card
      >`;const e=t.attributes,i=this._config.name??e.friendly_name??this._config.entity,s="unavailable"===t.state||"unknown"===t.state,a=this.hass.config?.unit_system?.temperature??"°C",r=this._colorMode();return B`
      <ha-card style=${`--mt-active-color: ${kt(r)}`}>
        <div class="header">
          <div class="name" title=${i}>${i}</div>
          <button class="more" aria-label="More information" @click=${this._showMoreInfo}>
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </button>
        </div>

        <mt-circular-dial
          .value=${this._targetTemp??e.min_temp??20}
          .min=${e.min_temp??7}
          .max=${e.max_temp??35}
          .step=${e.target_temp_step??.5}
          .current=${e.current_temperature}
          .mode=${r}
          .modeLabel=${s?"Unavailable":At(t.state)}
          .unit=${a}
          .dual=${this._isDual}
          .lowValue=${this._targetLow}
          .highValue=${this._targetHigh}
          .showCurrentAsPrimary=${this._config.show_current_as_primary??!1}
          .disabled=${s}
          @value-changing=${this._onChanging}
          @value-changed=${this._onChanged}
        ></mt-circular-dial>

        ${this._config.features?.length?B`<div class="features">
              ${this._config.features.map(t=>B`<mt-feature-row
                  .hass=${this.hass}
                  .entityId=${this._config.entity}
                  .feature=${t}
                ></mt-feature-row>`)}
            </div>`:W}
      </ha-card>
    `}disconnectedCallback(){super.disconnectedCallback(),this._debounceTimer&&window.clearTimeout(this._debounceTimer)}};qt.styles=[xt,o`
      ha-card {
        padding: 12px 16px 20px;
        border-radius: var(--mt-shape-card);
        /* visible so an open dropdown menu can extend past the card edge */
        overflow: visible;
      }
      .header {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        min-height: 36px;
      }
      .name {
        grid-column: 1 / -1;
        grid-row: 1;
        text-align: center;
        font-size: var(--md-sys-typescale-title-large-size, 20px);
        color: var(--mt-on-surface);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding: 0 36px;
      }
      .more {
        grid-column: 2;
        grid-row: 1;
        z-index: 1;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: var(--mt-shape-full);
        background: transparent;
        color: var(--mt-on-surface-variant);
        display: grid;
        place-items: center;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .more:hover {
        background: color-mix(in srgb, var(--mt-on-surface) 8%, transparent);
      }
      .features {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 16px;
      }
      .error {
        padding: 24px;
        text-align: center;
        color: var(--mt-error);
      }
    `],t([mt({attribute:!1})],qt.prototype,"hass",void 0),t([vt()],qt.prototype,"_config",void 0),t([vt()],qt.prototype,"_selectedTemp",void 0),t([vt()],qt.prototype,"_selectedLow",void 0),t([vt()],qt.prototype,"_selectedHigh",void 0),qt=t([ht(bt)],qt);let Kt=class extends ct{constructor(){super(...arguments),this.value="icons"}_set(t){t!==this.value&&this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t},bubbles:!0,composed:!0}))}render(){return B`
      <div class="seg">
        <button class=${"icons"===this.value?"on":""} @click=${()=>this._set("icons")}>
          <ha-icon icon="mdi:dots-grid"></ha-icon><span>Icons</span>
        </button>
        <button
          class=${"dropdown"===this.value?"on":""}
          @click=${()=>this._set("dropdown")}
        >
          <ha-icon icon="mdi:form-dropdown"></ha-icon><span>Dropdown</span>
        </button>
      </div>
    `}};Kt.styles=o`
    .seg {
      display: inline-flex;
      border: 1px solid var(--divider-color);
      border-radius: 999px;
      overflow: hidden;
    }
    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      font: inherit;
      font-size: 14px;
    }
    button + button {
      border-left: 1px solid var(--divider-color);
    }
    button.on {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    ha-icon {
      --mdc-icon-size: 18px;
    }
  `,t([mt()],Kt.prototype,"value",void 0),Kt=t([ht("mt-display-toggle")],Kt);let Wt=class extends ct{_values(){const t=this.hass?.states?.[this.entityId]?.attributes;return t?"hvac"===this.kind?t.hvac_modes??[]:"fan"===this.kind?t.fan_modes??[]:t.swing_modes??[]:[]}_override(t){return this.feature.options?.find(e=>e.value===t)}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setOverride(t,e){const i=[...this.feature.options??[]],s=i.findIndex(e=>e.value===t),a={...s>=0?i[s]:{value:t},...e};""===a.label&&delete a.label,""===a.icon&&delete a.icon,a.hide||delete a.hide;const r=void 0!==a.label||void 0!==a.icon||!!a.hide;s>=0?r?i[s]=a:i.splice(s,1):r&&i.push(a),this._emit({options:i})}render(){const t=this._values(),e=this.feature.display??"icons";return B`
      <div class="editor">
        <div class="field">
          <span class="field-label">Display</span>
          <mt-display-toggle
            .value=${e}
            @value-changed=${t=>this._emit({display:t.detail.value})}
          ></mt-display-toggle>
        </div>

        ${0===t.length?B`<p class="hint">
              Pick a climate entity that exposes ${this.kind} options to customize them.
            </p>`:B`<div class="options">
              ${t.map(t=>this._renderOption(t))}
            </div>`}
      </div>
    `}_renderOption(t){const e=this._override(t),i=!!e?.hide;return B`
      <div class="opt">
        <div class="opt-name" title=${t}>${At(t)}</div>
        <ha-textfield
          class="opt-label"
          label="Label"
          .value=${e?.label??""}
          .placeholder=${At(t)}
          @input=${e=>this._setOverride(t,{label:e.target.value})}
        ></ha-textfield>
        <ha-icon-picker
          class="opt-icon"
          .hass=${this.hass}
          .value=${e?.icon??""}
          @value-changed=${e=>this._setOverride(t,{icon:e.detail.value??""})}
        ></ha-icon-picker>
        <button
          class="opt-hide ${i?"on":""}"
          aria-label=${i?"Show option":"Hide option"}
          title=${i?"Hidden":"Visible"}
          @click=${()=>this._setOverride(t,{hide:!i})}
        >
          <ha-icon icon=${i?"mdi:eye-off":"mdi:eye"}></ha-icon>
        </button>
      </div>
    `}};Wt.styles=o`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 4px 0;
    }
    .field {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .field-label {
      color: var(--secondary-text-color);
      font-size: 14px;
    }
    .options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .opt {
      display: grid;
      grid-template-columns: minmax(70px, 1fr) 2fr auto auto;
      align-items: center;
      gap: 8px;
    }
    .opt-name {
      font-size: 13px;
      color: var(--secondary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    ha-icon-picker {
      width: 56px;
    }
    .opt-hide {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 50%;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .opt-hide.on {
      color: var(--error-color);
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 13px;
      margin: 0;
    }
  `,t([mt({attribute:!1})],Wt.prototype,"hass",void 0),t([mt()],Wt.prototype,"entityId",void 0),t([mt()],Wt.prototype,"kind",void 0),t([mt({attribute:!1})],Wt.prototype,"feature",void 0),Wt=t([ht("mt-climate-feature-editor")],Wt);let Yt=class extends ct{_values(){return this.hass?.states?.[this.feature.entity]?.attributes?.options??[]}_override(t){return this.feature.options?.find(e=>e.value===t)}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setOverride(t,e){const i=[...this.feature.options??[]],s=i.findIndex(e=>e.value===t),a={...s>=0?i[s]:{value:t},...e};""===a.label&&delete a.label,""===a.icon&&delete a.icon,a.hide||delete a.hide;const r=void 0!==a.label||void 0!==a.icon||!!a.hide;s>=0?r?i[s]=a:i.splice(s,1):r&&i.push(a),this._emit({options:i})}render(){const t=this._values(),e=this.feature.display??"icons";return B`
      <div class="editor">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this.feature.entity??""}
          .includeDomains=${["input_select"]}
          label="Input select entity"
          allow-custom-entity
          @value-changed=${t=>this._emit({entity:t.detail.value})}
        ></ha-entity-picker>

        <ha-textfield
          label="Row label (optional)"
          .value=${this.feature.label??""}
          @input=${t=>this._emit({label:t.target.value||void 0})}
        ></ha-textfield>

        <div class="field">
          <span class="field-label">Display</span>
          <mt-display-toggle
            .value=${e}
            @value-changed=${t=>this._emit({display:t.detail.value})}
          ></mt-display-toggle>
        </div>

        ${0===t.length?B`<p class="hint">Pick an input_select entity to customize its options.</p>`:B`<div class="options">
              ${t.map(t=>{const e=this._override(t),i=!!e?.hide;return B`<div class="opt">
                  <div class="opt-name" title=${t}>${At(t)}</div>
                  <ha-textfield
                    label="Label"
                    .value=${e?.label??""}
                    .placeholder=${At(t)}
                    @input=${e=>this._setOverride(t,{label:e.target.value})}
                  ></ha-textfield>
                  <ha-icon-picker
                    .hass=${this.hass}
                    .value=${e?.icon??""}
                    @value-changed=${e=>this._setOverride(t,{icon:e.detail.value??""})}
                  ></ha-icon-picker>
                  <button
                    class="opt-hide ${i?"on":""}"
                    title=${i?"Hidden":"Visible"}
                    @click=${()=>this._setOverride(t,{hide:!i})}
                  >
                    <ha-icon icon=${i?"mdi:eye-off":"mdi:eye"}></ha-icon>
                  </button>
                </div>`})}
            </div>`}
      </div>
    `}};Yt.styles=o`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 4px 0;
    }
    ha-entity-picker,
    ha-textfield {
      width: 100%;
    }
    .field {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .field-label {
      color: var(--secondary-text-color);
      font-size: 14px;
    }
    .options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .opt {
      display: grid;
      grid-template-columns: minmax(70px, 1fr) 2fr auto auto;
      align-items: center;
      gap: 8px;
    }
    .opt-name {
      font-size: 13px;
      color: var(--secondary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    ha-icon-picker {
      width: 56px;
    }
    .opt-hide {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 50%;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .opt-hide.on {
      color: var(--error-color);
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 13px;
      margin: 0;
    }
  `,t([mt({attribute:!1})],Yt.prototype,"hass",void 0),t([mt({attribute:!1})],Yt.prototype,"feature",void 0),Yt=t([ht("mt-input-select-editor")],Yt);let Xt=class extends ct{constructor(){super(...arguments),this.itemsKey="entities",this.showDisplay=!1}get _items(){return this.feature[this.itemsKey]??[]}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setItems(t){this._emit({[this.itemsKey]:t})}_updateItem(t,e){const i=[...this._items],s={...i[t],...e};""===s.label&&delete s.label,""===s.icon&&delete s.icon,i[t]=s,this._setItems(i)}_addItem(){this._setItems([...this._items,{entity:""}])}_removeItem(t){const e=[...this._items];e.splice(t,1),this._setItems(e)}render(){const t=this.feature.display??"icons";return B`
      <div class="editor">
        <ha-textfield
          label="Row label (optional)"
          .value=${this.feature.label??""}
          @input=${t=>this._emit({label:t.target.value||void 0})}
        ></ha-textfield>

        ${this.showDisplay?B`<div class="field">
              <span class="field-label">Display</span>
              <mt-display-toggle
                .value=${t}
                @value-changed=${t=>this._emit({display:t.detail.value})}
              ></mt-display-toggle>
            </div>`:W}

        <div class="items">
          ${this._items.map((t,e)=>B`<div class="item">
              <ha-entity-picker
                .hass=${this.hass}
                .value=${t.entity??""}
                .includeDomains=${this.includeDomains}
                allow-custom-entity
                @value-changed=${t=>this._updateItem(e,{entity:t.detail.value})}
              ></ha-entity-picker>
              <ha-textfield
                label="Label"
                .value=${t.label??""}
                @input=${t=>this._updateItem(e,{label:t.target.value})}
              ></ha-textfield>
              <ha-icon-picker
                .hass=${this.hass}
                .value=${t.icon??""}
                @value-changed=${t=>this._updateItem(e,{icon:t.detail.value??""})}
              ></ha-icon-picker>
              <button class="del" title="Remove" @click=${()=>this._removeItem(e)}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>`)}
        </div>

        <ha-button @click=${this._addItem}>
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          Add entity
        </ha-button>
      </div>
    `}};Xt.styles=o`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 4px 0;
    }
    ha-textfield {
      width: 100%;
    }
    .field {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .field-label {
      color: var(--secondary-text-color);
      font-size: 14px;
    }
    .items {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .item {
      display: grid;
      grid-template-columns: 2fr 1.4fr auto auto;
      align-items: center;
      gap: 8px;
    }
    ha-icon-picker {
      width: 56px;
    }
    .del {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 50%;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .del:hover {
      color: var(--error-color);
    }
    ha-button {
      align-self: flex-start;
      --mdc-theme-primary: var(--primary-color);
    }
  `,t([mt({attribute:!1})],Xt.prototype,"hass",void 0),t([mt({attribute:!1})],Xt.prototype,"feature",void 0),t([mt()],Xt.prototype,"itemsKey",void 0),t([mt({type:Boolean})],Xt.prototype,"showDisplay",void 0),t([mt({attribute:!1})],Xt.prototype,"includeDomains",void 0),Xt=t([ht("mt-entity-list-editor")],Xt);const Jt=[{name:"entity",selector:{entity:{}}},{name:"name",selector:{text:{}}},{name:"icon",selector:{icon:{}}},{name:"tap_action",selector:{ui_action:{}}}];let Zt,Gt=class extends ct{constructor(){super(...arguments),this._computeLabel=t=>{switch(t.name){case"entity":return"Entity";case"name":return"Name (optional)";case"icon":return"Icon (optional)";case"tap_action":return"Tap action";default:return t.name}}}get _data(){return{entity:this.feature.entity,name:this.feature.name,icon:this.feature.icon,tap_action:this.feature.tap_action}}_changed(t){const e=t.detail.value;this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{type:"entity-tile",entity:e.entity,name:e.name||void 0,icon:e.icon||void 0,tap_action:e.tap_action||void 0}},bubbles:!0,composed:!0}))}render(){return B`<ha-form
      .hass=${this.hass}
      .data=${this._data}
      .schema=${Jt}
      .computeLabel=${this._computeLabel}
      @value-changed=${this._changed}
    ></ha-form>`}};t([mt({attribute:!1})],Gt.prototype,"hass",void 0),t([mt({attribute:!1})],Gt.prototype,"feature",void 0),Gt=t([ht("mt-entity-tile-editor")],Gt);const Qt=[{name:"entity",selector:{entity:{domain:"climate"}}},{name:"name",selector:{text:{}}},{name:"theme",selector:{theme:{}}},{name:"show_current_as_primary",selector:{boolean:{}}}],te=[{type:"climate-hvac-modes",label:"Climate HVAC modes"},{type:"climate-fan-modes",label:"Climate fan modes"},{type:"climate-swing-modes",label:"Climate swing modes"},{type:"input-select",label:"Input select"},{type:"switch-group",label:"Switch group"},{type:"switch-list",label:"Switch list"},{type:"button-list",label:"Button list"},{type:"entity-tile",label:"Entity tile"}];function ee(t){switch(t){case"input-select":case"entity-tile":return{type:t,entity:""};case"switch-group":case"switch-list":return{type:t,entities:[]};case"button-list":return{type:t,items:[]};default:return{type:t}}}const ie={"climate-hvac-modes":"Climate HVAC modes","climate-fan-modes":"Climate fan modes","climate-swing-modes":"Climate swing modes","input-select":"Input select","switch-group":"Switch group","switch-list":"Switch list","button-list":"Button list","entity-tile":"Entity tile"};let se=class extends ct{constructor(){super(...arguments),this._editingIndex=null,this._addOpen=!1,this._computeLabel=t=>{switch(t.name){case"entity":return"Climate entity (required)";case"name":return"Name";case"theme":return"Theme";case"show_current_as_primary":return"Show current temperature as primary information";default:return t.name}}}connectedCallback(){super.connectedCallback(),(Zt||(Zt=(async()=>{if(customElements.get("ha-form")&&customElements.get("ha-entity-picker")&&customElements.get("ha-icon-picker"))return;const t=window.loadCardHelpers;if(t)try{const e=await t(),i=await e.createCardElement({type:"entities",entities:[]}),s=i?.constructor;s?.getConfigElement&&await s.getConfigElement()}catch{}})(),Zt)).then(()=>this.requestUpdate())}setConfig(t){this._config=t}get _baseData(){return{entity:this._config.entity,name:this._config.name,theme:this._config.theme,show_current_as_primary:this._config.show_current_as_primary??!1}}_emit(t){this._config=t,yt(this,"config-changed",{config:t})}_baseChanged(t){const e=t.detail.value,i={...this._config,entity:e.entity,name:e.name||void 0,theme:e.theme||void 0,show_current_as_primary:e.show_current_as_primary||void 0};this._emit(i)}get _features(){return this._config.features??[]}_setFeatures(t){this._emit({...this._config,features:t})}_pickFeature(t){this._addOpen=!1;const e=[...this._features,ee(t)];this._editingIndex=e.length-1,this._setFeatures(e)}_removeFeature(t){const e=[...this._features];e.splice(t,1),this._editingIndex=null,this._setFeatures(e)}_moveFeature(t){const{oldIndex:e,newIndex:i}=t.detail,s=[...this._features],[a]=s.splice(e,1);s.splice(i,0,a),this._editingIndex=null,this._setFeatures(s)}_featureChanged(t,e){const i=[...this._features];i[t]=e.detail.feature,this._setFeatures(i)}render(){return this._config&&this.hass?B`
      <div class="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._baseData}
          .schema=${Qt}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._baseChanged}
        ></ha-form>

        <div class="features-header">
          <span>Features</span>
        </div>

        <ha-sortable handle-selector=".handle" @item-moved=${this._moveFeature}>
          <div class="features">
            ${this._features.map((t,e)=>this._renderFeatureRow(t,e))}
          </div>
        </ha-sortable>

        <div class="add">
          <button
            class="add-btn"
            aria-expanded=${this._addOpen?"true":"false"}
            @click=${()=>this._addOpen=!this._addOpen}
          >
            <ha-icon icon=${this._addOpen?"mdi:close":"mdi:plus"}></ha-icon>
            <span>Add feature</span>
          </button>
          ${this._addOpen?B`<div class="add-menu">
                ${te.map(t=>B`<button class="add-opt" @click=${()=>this._pickFeature(t.type)}>
                    ${t.label}
                  </button>`)}
              </div>`:W}
        </div>
      </div>
    `:B``}_renderFeatureRow(t,e){const i=this._editingIndex===e;return B`
      <div class="feature">
        <div class="feature-head">
          <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
          <div class="feature-title">${ie[t.type]??t.type}</div>
          <button
            class="icon-btn"
            aria-label="Edit feature"
            @click=${()=>this._editingIndex=i?null:e}
          >
            <ha-icon icon=${i?"mdi:chevron-up":"mdi:pencil"}></ha-icon>
          </button>
          <button
            class="icon-btn"
            aria-label="Delete feature"
            @click=${()=>this._removeFeature(e)}
          >
            <ha-icon icon="mdi:delete"></ha-icon>
          </button>
        </div>
        ${i?this._renderFeatureEditor(t,e):W}
      </div>
    `}_renderFeatureEditor(t,e){const i=t=>this._featureChanged(e,t);let s;switch(t.type){case"climate-hvac-modes":case"climate-fan-modes":case"climate-swing-modes":{const e="climate-hvac-modes"===t.type?"hvac":"climate-fan-modes"===t.type?"fan":"swing";s=B`<mt-climate-feature-editor
          .hass=${this.hass}
          .entityId=${this._config.entity}
          kind=${e}
          .feature=${t}
          @feature-changed=${i}
        ></mt-climate-feature-editor>`;break}case"input-select":s=B`<mt-input-select-editor
          .hass=${this.hass}
          .feature=${t}
          @feature-changed=${i}
        ></mt-input-select-editor>`;break;case"switch-group":s=B`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${t}
          itemsKey="entities"
          .showDisplay=${!0}
          .includeDomains=${["switch","input_boolean","light","fan"]}
          @feature-changed=${i}
        ></mt-entity-list-editor>`;break;case"switch-list":s=B`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${t}
          itemsKey="entities"
          .includeDomains=${["switch","input_boolean","light","fan"]}
          @feature-changed=${i}
        ></mt-entity-list-editor>`;break;case"button-list":s=B`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${t}
          itemsKey="items"
          .includeDomains=${["button","input_button","scene","script"]}
          @feature-changed=${i}
        ></mt-entity-list-editor>`;break;case"entity-tile":s=B`<mt-entity-tile-editor
          .hass=${this.hass}
          .feature=${t}
          @feature-changed=${i}
        ></mt-entity-tile-editor>`;break;default:s=B`<p class="hint">No editor available.</p>`}return B`<div class="feature-editor">${s}</div>`}};se.styles=o`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .features-header {
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .features {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .feature {
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      overflow: hidden;
      background: var(--secondary-background-color);
    }
    .feature-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 8px 8px 4px;
    }
    .handle {
      cursor: grab;
      color: var(--secondary-text-color);
      display: grid;
      place-items: center;
    }
    .feature-title {
      flex: 1;
      color: var(--primary-text-color);
    }
    .icon-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      border-radius: 50%;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .icon-btn:hover {
      background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
    }
    .feature-editor {
      padding: 8px 12px 12px;
      border-top: 1px solid var(--divider-color);
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 13px;
      margin: 0;
    }
    .add {
      position: relative;
    }
    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: none;
      border-radius: 999px;
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      cursor: pointer;
      font: inherit;
      font-size: 14px;
      font-weight: 500;
    }
    .add-btn ha-icon {
      --mdc-icon-size: 18px;
    }
    .add-menu {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      background: var(--card-background-color, var(--secondary-background-color));
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      overflow: hidden;
    }
    .add-opt {
      text-align: left;
      padding: 12px 16px;
      border: none;
      background: transparent;
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
      font-size: 14px;
    }
    .add-opt:hover {
      background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
    }
    .add-opt:not(:last-child) {
      border-bottom: 1px solid var(--divider-color);
    }
  `,t([mt({attribute:!1})],se.prototype,"hass",void 0),t([vt()],se.prototype,"_config",void 0),t([vt()],se.prototype,"_editingIndex",void 0),t([vt()],se.prototype,"_addOpen",void 0),se=t([ht($t)],se);var ae=Object.freeze({__proto__:null,get MaterialThermostatCardEditor(){return se}});export{qt as MaterialThermostatCard};
