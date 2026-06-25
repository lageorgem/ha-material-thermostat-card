function t(t,e,i,s){var r,o=arguments.length,a=o<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,i,s);else for(var n=t.length-1;n>=0;n--)(r=t[n])&&(a=(o<3?r(a):o>3?r(e,i,a):r(e,i))||a);return o>3&&a&&Object.defineProperty(e,i,a),a}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),r=new WeakMap;let o=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(e,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new o(i,t,s)},n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:c,defineProperty:l,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,f=m.trustedTypes,v=f?f.emptyScript:"",_=m.reactiveElementPolyfillSupport,g=(t,e)=>t,y={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},$=(t,e)=>!c(t,e),b={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:$};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&l(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:r}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const o=s?.call(this);r?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(g("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(g("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(g("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),r=e.litNonce;void 0!==r&&s.setAttribute("nonce",r),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:y;this._$Em=s;const o=r.fromAttribute(e,t.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i,s=!1,r){if(void 0!==t){const o=this.constructor;if(!1===s&&(r=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??$)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:r},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==r||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[g("elementProperties")]=new Map,w[g("finalized")]=new Map,_?.({ReactiveElement:w}),(m.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,A=t=>t,E=x.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,C="$lit$",k=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+k,M=`<${P}>`,O=document,T=()=>O.createComment(""),U=t=>null===t||"object"!=typeof t&&"function"!=typeof t,I=Array.isArray,z="[ \t\n\f\r]",j=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,H=/>/g,N=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),D=/'/g,L=/"/g,F=/^(?:script|style|textarea|title)$/i,V=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),B=V(1),q=V(2),W=Symbol.for("lit-noChange"),K=Symbol.for("lit-nothing"),X=new WeakMap,Y=O.createTreeWalker(O,129);function J(t,e){if(!I(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,s=[];let r,o=2===e?"<svg>":3===e?"<math>":"",a=j;for(let e=0;e<i;e++){const i=t[e];let n,c,l=-1,h=0;for(;h<i.length&&(a.lastIndex=h,c=a.exec(i),null!==c);)h=a.lastIndex,a===j?"!--"===c[1]?a=R:void 0!==c[1]?a=H:void 0!==c[2]?(F.test(c[2])&&(r=RegExp("</"+c[2],"g")),a=N):void 0!==c[3]&&(a=N):a===N?">"===c[0]?(a=r??j,l=-1):void 0===c[1]?l=-2:(l=a.lastIndex-c[2].length,n=c[1],a=void 0===c[3]?N:'"'===c[3]?L:D):a===L||a===D?a=N:a===R||a===H?a=j:(a=N,r=void 0);const d=a===N&&t[e+1].startsWith("/>")?" ":"";o+=a===j?i+M:l>=0?(s.push(n),i.slice(0,l)+C+i.slice(l)+k+d):i+k+(-2===l?e:d)}return[J(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class G{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let r=0,o=0;const a=t.length-1,n=this.parts,[c,l]=Z(t,e);if(this.el=G.createElement(c,i),Y.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=Y.nextNode())&&n.length<a;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(C)){const e=l[o++],i=s.getAttribute(t).split(k),a=/([.?@])?(.*)/.exec(e);n.push({type:1,index:r,name:a[2],strings:i,ctor:"."===a[1]?st:"?"===a[1]?rt:"@"===a[1]?ot:it}),s.removeAttribute(t)}else t.startsWith(k)&&(n.push({type:6,index:r}),s.removeAttribute(t));if(F.test(s.tagName)){const t=s.textContent.split(k),e=t.length-1;if(e>0){s.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],T()),Y.nextNode(),n.push({type:2,index:++r});s.append(t[e],T())}}}else if(8===s.nodeType)if(s.data===P)n.push({type:2,index:r});else{let t=-1;for(;-1!==(t=s.data.indexOf(k,t+1));)n.push({type:7,index:r}),t+=k.length-1}r++}}static createElement(t,e){const i=O.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,s){if(e===W)return e;let r=void 0!==s?i._$Co?.[s]:i._$Cl;const o=U(e)?void 0:e._$litDirective$;return r?.constructor!==o&&(r?._$AO?.(!1),void 0===o?r=void 0:(r=new o(t),r._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=r:i._$Cl=r),void 0!==r&&(e=Q(t,r._$AS(t,e.values),r,s)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??O).importNode(e,!0);Y.currentNode=s;let r=Y.nextNode(),o=0,a=0,n=i[0];for(;void 0!==n;){if(o===n.index){let e;2===n.type?e=new et(r,r.nextSibling,this,t):1===n.type?e=new n.ctor(r,n.name,n.strings,this,t):6===n.type&&(e=new at(r,this,t)),this._$AV.push(e),n=i[++a]}o!==n?.index&&(r=Y.nextNode(),o++)}return Y.currentNode=O,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=K,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),U(t)?t===K||null==t||""===t?(this._$AH!==K&&this._$AR(),this._$AH=K):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>I(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==K&&U(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=G.createElement(J(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new tt(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=X.get(t.strings);return void 0===e&&X.set(t.strings,e=new G(t)),e}k(t){I(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const r of t)s===e.length?e.push(i=new et(this.O(T()),this.O(T()),this,this.options)):i=e[s],i._$AI(r),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class it{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,r){this.type=1,this._$AH=K,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=K}_$AI(t,e=this,i,s){const r=this.strings;let o=!1;if(void 0===r)t=Q(this,t,e,0),o=!U(t)||t!==this._$AH&&t!==W,o&&(this._$AH=t);else{const s=t;let a,n;for(t=r[0],a=0;a<r.length-1;a++)n=Q(this,s[i+a],e,a),n===W&&(n=this._$AH[a]),o||=!U(n)||n!==this._$AH[a],n===K?t=K:t!==K&&(t+=(n??"")+r[a+1]),this._$AH[a]=n}o&&!s&&this.j(t)}j(t){t===K?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===K?void 0:t}}class rt extends it{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==K)}}class ot extends it{constructor(t,e,i,s,r){super(t,e,i,s,r),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??K)===W)return;const i=this._$AH,s=t===K&&i!==K||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==K&&(i===K||s);s&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const nt=x.litHtmlPolyfillSupport;nt?.(G,et),(x.litHtmlVersions??=[]).push("3.3.3");const ct=globalThis;let lt=class extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let r=s._$litPart$;if(void 0===r){const t=i?.renderBefore??null;s._$litPart$=r=new et(e.insertBefore(T(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}};lt._$litElement$=!0,lt.finalized=!0,ct.litElementHydrateSupport?.({LitElement:lt});const ht=ct.litElementPolyfillSupport;ht?.({LitElement:lt}),(ct.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:$},ut=(t=pt,e,i)=>{const{kind:s,metadata:r}=i;let o=globalThis.litPropertyMetadata.get(r);if(void 0===o&&globalThis.litPropertyMetadata.set(r,o=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,r,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const r=this[s];e.call(this,i),this.requestUpdate(s,r,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function mt(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ft(t){return mt({...t,state:!0,attribute:!1})}var vt,_t;function gt(){return(gt=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var s in i)Object.prototype.hasOwnProperty.call(i,s)&&(t[s]=i[s])}return t}).apply(this,arguments)}!function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(vt||(vt={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(_t||(_t={}));var yt=function(t,e,i,s){s=s||{},i=null==i?{}:i;var r=new Event(e,{bubbles:void 0===s.bubbles||s.bubbles,cancelable:Boolean(s.cancelable),composed:void 0===s.composed||s.composed});return r.detail=i,t.dispatchEvent(r),r};const $t="material-thermostat-card",bt="material-thermostat-card-editor",wt=a`
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
`,xt={off:"mdi:power",heat:"mdi:fire",cool:"mdi:snowflake",heat_cool:"mdi:sun-snowflake-variant",auto:"mdi:thermostat-auto",dry:"mdi:water-percent",fan_only:"mdi:fan"};function At(t){switch(t){case"cool":return"var(--state-climate-cool-color, #2b9af9)";case"heat":return"var(--state-climate-heat-color, #ff8100)";case"heat_cool":return"var(--state-climate-heat_cool-color, #009688)";case"auto":return"var(--state-climate-auto-color, #e5c454)";case"dry":return"var(--state-climate-dry-color, #efbd07)";case"fan_only":return"var(--state-climate-fan_only-color, #8a8a8a)";default:return"var(--state-climate-off-color, var(--mt-on-surface-variant))"}}function Et(t){return"heat_cool"===t?"Heat/Cool":t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}const St=132,Ct=225;function kt(t,e){const i=(t-90)*Math.PI/180;return{x:160+e*Math.cos(i),y:160+e*Math.sin(i)}}function Pt(t,e,i){const s=kt(t,i),r=kt(e,i),o=e-t>180?1:0;return`M ${s.x} ${s.y} A ${i} ${i} 0 ${o} 1 ${r.x} ${r.y}`}let Mt=class extends lt{constructor(){super(...arguments),this.value=20,this.min=7,this.max=35,this.step=.5,this.mode="off",this.modeLabel="",this.unit="°C",this.showCurrentAsPrimary=!1,this.disabled=!1,this._dragging=!1,this._dragValue=0,this._onPointerDown=t=>{this.disabled||(t.preventDefault(),this._svg.setPointerCapture(t.pointerId),this._dragging=!0,this._dragValue=this._valueFromPoint(t.clientX,t.clientY),this._emit("value-changing",this._dragValue))},this._onPointerMove=t=>{if(!this._dragging)return;const e=this._valueFromPoint(t.clientX,t.clientY);e!==this._dragValue&&(this._dragValue=e,this._emit("value-changing",e))},this._onPointerUp=t=>{this._dragging&&(this._svg.releasePointerCapture(t.pointerId),this._dragging=!1,this._emit("value-changed",this._dragValue))},this._onKeyDown=t=>{if(this.disabled)return;let e;"ArrowUp"===t.key||"ArrowRight"===t.key?e=this.value+this.step:"ArrowDown"!==t.key&&"ArrowLeft"!==t.key||(e=this.value-this.step),void 0!==e&&(t.preventDefault(),this._emit("value-changed",this._roundToStep(e)))}}get _displayValue(){return this._dragging?this._dragValue:this.value}get _precision(){return this.step<1?1:0}_angleOf(t){const e=(t-this.min)/(this.max-this.min||1);return Ct+270*Math.min(1,Math.max(0,e))}_roundToStep(t){const e=Math.min(this.max,Math.max(this.min,t)),i=Math.round(e/this.step)*this.step;return parseFloat(i.toFixed(this._precision))}_valueFromPoint(t,e){const i=this._svg.getBoundingClientRect(),s=i.left+i.width/2,r=i.top+i.height/2;let o,a=180*Math.atan2(e-r,t-s)/Math.PI+90;a=(a%360+360)%360,o=a>=Ct?a-Ct:a<=135?a+360-Ct:a<180?270:0;const n=Math.min(1,Math.max(0,o/270));return this._roundToStep(this.min+n*(this.max-this.min))}_step(t){this.disabled||this._emit("value-changed",this._roundToStep(this.value+t*this.step))}_emit(t,e){this.dispatchEvent(new CustomEvent(t,{detail:{value:e},bubbles:!0,composed:!0}))}_fmt(t,e){return null==t||Number.isNaN(t)?"—":t.toFixed(e)}render(){const t=At(this.mode),e=this._displayValue,i=kt(this._angleOf(e),St),s=this.showCurrentAsPrimary&&null!=this.current?this.current:e,r=this.showCurrentAsPrimary?e:this.current,o=this.showCurrentAsPrimary?1:this._precision,a=this.showCurrentAsPrimary?this._precision:1,n=this.showCurrentAsPrimary?"mdi:thermostat":"mdi:thermometer",c=null!=this.current&&this.current>=this.min&&this.current<=this.max?kt(this._angleOf(this.current),St):null;return B`
      <div class="dial" style=${`--dial-color: ${t}`}>
        <svg
          viewBox="0 0 ${320} ${320}"
          role="slider"
          tabindex=${this.disabled?-1:0}
          aria-valuemin=${this.min}
          aria-valuemax=${this.max}
          aria-valuenow=${e}
          aria-label="Target temperature"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
          @keydown=${this._onKeyDown}
        >
          <path
            class="track"
            d=${Pt(Ct,495,St)}
            stroke-width=${16}
          />
          <path
            class="value"
            d=${Pt(Ct,this._angleOf(e),St)}
            stroke-width=${16}
          />
          ${c?q`<circle class="current-dot" cx=${c.x} cy=${c.y} r="4" />`:K}
          <circle class="handle" cx=${i.x} cy=${i.y} r="13" />
        </svg>

        <div class="center">
          ${this.modeLabel?B`<div class="mode">${this.modeLabel}</div>`:K}
          <div class="temp">
            <span class="value-text">${this._fmt(s,o)}</span>
            <span class="unit">${this.unit}</span>
          </div>
          ${null!=r?B`<div class="sub">
                <ha-icon icon=${n}></ha-icon>
                <span>${this._fmt(r,a)} ${this.unit}</span>
              </div>`:K}
        </div>

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
      </div>
    `}};Mt.styles=[wt,a`
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
        transition: stroke 240ms cubic-bezier(0.2, 0, 0, 1);
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
        transition: background-color 180ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .step ha-icon {
        --mdc-icon-size: 24px;
      }
      .step:hover:not([disabled]) {
        background: color-mix(in srgb, var(--mt-on-surface) 8%, var(--mt-surface-container-high));
      }
      .step:active:not([disabled]) {
        background: color-mix(in srgb, var(--mt-on-surface) 12%, var(--mt-surface-container-high));
      }
      .step[disabled] {
        opacity: 0.38;
        cursor: default;
      }
    `],t([mt({type:Number})],Mt.prototype,"value",void 0),t([mt({type:Number})],Mt.prototype,"min",void 0),t([mt({type:Number})],Mt.prototype,"max",void 0),t([mt({type:Number})],Mt.prototype,"step",void 0),t([mt({type:Number})],Mt.prototype,"current",void 0),t([mt()],Mt.prototype,"mode",void 0),t([mt()],Mt.prototype,"modeLabel",void 0),t([mt()],Mt.prototype,"unit",void 0),t([mt({type:Boolean})],Mt.prototype,"showCurrentAsPrimary",void 0),t([mt({type:Boolean})],Mt.prototype,"disabled",void 0),t([ft()],Mt.prototype,"_dragging",void 0),t([ft()],Mt.prototype,"_dragValue",void 0),t([(t,e,i)=>((t,e,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof e&&Object.defineProperty(t,e,i),i))(t,e,{get(){return t=this,t.renderRoot?.querySelector("svg")??null;var t}})],Mt.prototype,"_svg",void 0),Mt=t([dt("mt-circular-dial")],Mt);class Ot{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}const Tt=(Ut=class extends Ot{constructor(t){if(super(t),1!==t.type||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(e=>t[e]).join(" ")+" "}update(t,[e]){if(void 0===this.st){this.st=new Set,void 0!==t.strings&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter(t=>""!==t)));for(const t in e)e[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(e)}const i=t.element.classList;for(const t of this.st)t in e||(i.remove(t),this.st.delete(t));for(const t in e){const s=!!e[t];s===this.st.has(t)||this.nt?.has(t)||(s?(i.add(t),this.st.add(t)):(i.remove(t),this.st.delete(t)))}return W}},(...t)=>({_$litDirective$:Ut,values:t}));var Ut;let It=class extends lt{constructor(){super(...arguments),this.items=[],this.display="icons"}_select(t){this.dispatchEvent(new CustomEvent("item-selected",{detail:{value:t},bubbles:!0,composed:!0}))}render(){return this.items.length?"dropdown"===this.display?this._renderDropdown():this._renderIcons():K}_renderIcons(){return B`
      <div class="row">
        ${this.label?B`<span class="row-label">${this.label}</span>`:K}
        <div class="chips" role="group" aria-label=${this.label??"options"}>
          ${this.items.map(t=>B`
              <button
                class=${Tt({chip:!0,active:!!t.active})}
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
    `}_renderDropdown(){const t=this.items.find(t=>t.active)??this.items[0];return B`
      <ha-select
        class="dropdown"
        naturalMenuWidth
        fixedMenuPosition
        .label=${this.label??""}
        .value=${t?.value??""}
        @selected=${e=>{const i=e.target?.value;i&&i!==t?.value&&this._select(i)}}
        @closed=${t=>t.stopPropagation()}
      >
        ${t?.icon?B`<ha-icon slot="icon" icon=${t.icon}></ha-icon>`:K}
        ${this.items.map(t=>B`
            <ha-list-item .value=${t.value} graphic=${t.icon?"icon":void 0}>
              ${t.icon?B`<ha-icon slot="graphic" icon=${t.icon}></ha-icon>`:K}
              ${t.label}
            </ha-list-item>
          `)}
      </ha-select>
    `}};It.styles=[wt,a`
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
      .dropdown {
        width: 100%;
        --mdc-theme-primary: var(--mt-primary);
      }
    `],t([mt({attribute:!1})],It.prototype,"items",void 0),t([mt()],It.prototype,"display",void 0),t([mt()],It.prototype,"label",void 0),It=t([dt("mt-selector-row")],It);let zt=class extends lt{constructor(){super(...arguments),this.kind="hvac",this.display="icons"}get _stateObj(){return this.hass?.states?.[this.entityId]}_overrideMap(){const t=new Map;return(this.options??[]).forEach(e=>t.set(e.value,e)),t}_build(){const t=this._stateObj;if(!t)return[];const e=this._overrideMap();let i,s,r=[];return"hvac"===this.kind?(r=t.attributes.hvac_modes??[],i=t.state,s=t=>xt[t]??"mdi:thermostat"):"fan"===this.kind?(r=t.attributes.fan_modes??[],i=t.attributes.fan_mode,s=t=>function(t){const e=t.toLowerCase();return e.includes("auto")?"mdi:fan-auto":e.includes("off")||"0"===e?"mdi:fan-off":/(^|[^0-9])1([^0-9]|$)|low|min|quiet|silent/.test(e)?"mdi:fan-speed-1":/(^|[^0-9])2([^0-9]|$)|mid|med/.test(e)?"mdi:fan-speed-2":/(^|[^0-9])3([^0-9]|$)|high|max|strong|turbo/.test(e)?"mdi:fan-speed-3":"mdi:fan"}(t)):(r=t.attributes.swing_modes??[],i=t.attributes.swing_mode,s=t=>function(t){const e=t.toLowerCase();return"off"===e||"stop"===e||"fixed"===e?"mdi:arrow-expand-vertical":"both"===e||"on"===e||"full"===e?"mdi:arrow-all":e.includes("horizontal")?"mdi:arrow-left-right":e.includes("vertical")?"mdi:arrow-up-down":"mdi:swap-vertical"}(t)),r.filter(t=>!e.get(t)?.hide).map(t=>({value:t,label:e.get(t)?.label??Et(t),icon:e.get(t)?.icon??s(t),active:t===i}))}_onSelect(t){const e=t.detail.value;if(!this._stateObj)return;const i=this.entityId;"hvac"===this.kind?this.hass.callService("climate","set_hvac_mode",{entity_id:i,hvac_mode:e}):"fan"===this.kind?this.hass.callService("climate","set_fan_mode",{entity_id:i,fan_mode:e}):this.hass.callService("climate","set_swing_mode",{entity_id:i,swing_mode:e})}render(){const t=this._build();return t.length?B`
      <mt-selector-row
        .items=${t}
        display=${this.display}
        @item-selected=${this._onSelect}
      ></mt-selector-row>
    `:K}};t([mt({attribute:!1})],zt.prototype,"hass",void 0),t([mt()],zt.prototype,"entityId",void 0),t([mt()],zt.prototype,"kind",void 0),t([mt()],zt.prototype,"display",void 0),t([mt({attribute:!1})],zt.prototype,"options",void 0),zt=t([dt("mt-climate-selector")],zt);let jt=class extends lt{render(){const t=this.feature;switch(t.type){case"climate-hvac-modes":return B`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind="hvac"
          display=${t.display??"icons"}
          .options=${t.options}
        ></mt-climate-selector>`;case"climate-fan-modes":return B`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind="fan"
          display=${t.display??"icons"}
          .options=${t.options}
        ></mt-climate-selector>`;case"climate-swing-modes":return B`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind="swing"
          display=${t.display??"icons"}
          .options=${t.options}
        ></mt-climate-selector>`;default:return K}}};jt.styles=a`
    :host {
      display: block;
      width: 100%;
    }
  `,t([mt({attribute:!1})],jt.prototype,"hass",void 0),t([mt()],jt.prototype,"entityId",void 0),t([mt({attribute:!1})],jt.prototype,"feature",void 0),jt=t([dt("mt-feature-row")],jt),console.info("%c MATERIAL-THERMOSTAT-CARD %c v0.1.0 ","color: white; background: #6750a4; font-weight: 700;","color: #6750a4; background: white; font-weight: 700;"),window.customCards=window.customCards||[],window.customCards.push({type:$t,name:"Material Thermostat Card",description:"A Material 3 Expressive thermostat card with customizable selectors and Nest/Google Home inspired UI.",preview:!0,documentationURL:"https://github.com/lageorgem/ha-material-thermostat-card"});let Rt=class extends lt{static async getConfigElement(){return await Promise.resolve().then(function(){return Vt}),document.createElement(bt)}static getStubConfig(t){const e=Object.keys(t.states).find(t=>t.startsWith("climate."))??"";return{type:`custom:${$t}`,entity:e,features:[{type:"climate-hvac-modes"}]}}setConfig(t){if(!t.entity||"climate"!==t.entity.split(".")[0])throw new Error("You must specify a climate entity.");this._config=t}getCardSize(){return 7+(this._config?.features?.length??0)}get _stateObj(){return this.hass?.states?.[this._config?.entity]}_trackedEntityIds(){const t=new Set([this._config.entity]);for(const e of this._config.features??[])"entity"in e&&e.entity&&t.add(e.entity),"entities"in e&&e.entities?.forEach(e=>t.add(e.entity)),"items"in e&&e.items?.forEach(e=>t.add(e.entity));return[...t]}shouldUpdate(t){if(t.has("_config")||t.has("_selectedTemp"))return!0;if(!this._config)return!1;if(t.has("hass")){const e=t.get("hass");return!e||this._trackedEntityIds().some(t=>e.states[t]!==this.hass.states[t])}return!1}updated(t){if(t.has("hass")||t.has("_config")){const e=t.get("hass");!this._config?.theme||e&&e.themes===this.hass.themes&&!t.has("_config")||function(t,e,i,s){void 0===s&&(s=!1),t._themes||(t._themes={});var r=e.default_theme;("default"===i||i&&e.themes[i])&&(r=i);var o=gt({},t._themes);if("default"!==r){var a=e.themes[r];Object.keys(a).forEach(function(e){var i="--"+e;t._themes[i]="",o[i]=a[e]})}if(t.updateStyles?t.updateStyles(o):window.ShadyCSS&&window.ShadyCSS.styleSubtree(t,o),s){var n=document.querySelector("meta[name=theme-color]");if(n){n.hasAttribute("default-content")||n.setAttribute("default-content",n.getAttribute("content"));var c=o["--primary-color"]||n.getAttribute("default-content");n.setAttribute("content",c)}}}(this,this.hass.themes,this._config.theme)}if(t.has("hass")&&null!=this._selectedTemp){const t=this._stateObj?.attributes.temperature;t===this._selectedTemp&&(this._selectedTemp=void 0)}}get _targetTemp(){if(null!=this._selectedTemp)return this._selectedTemp;const t=this._stateObj?.attributes;return t?.temperature??t?.target_temp_low}_commitTemp(t){this._selectedTemp=t,this._debounceTimer&&window.clearTimeout(this._debounceTimer),this._debounceTimer=window.setTimeout(()=>{this.hass.callService("climate","set_temperature",{entity_id:this._config.entity,temperature:t})},600)}_onChanging(t){this._selectedTemp=t.detail.value}_onChanged(t){this._commitTemp(t.detail.value)}_showMoreInfo(){yt(this,"hass-more-info",{entityId:this._config.entity})}_colorMode(){const t=this._stateObj?.attributes;switch(t?.hvac_action){case"cooling":return"cool";case"heating":return"heat";case"drying":return"dry";case"fan":return"fan_only";default:return this._stateObj?.state??"off"}}render(){if(!this._config||!this.hass)return B``;const t=this._stateObj;if(!t)return B`<ha-card
        ><div class="error">Entity not found: ${this._config.entity}</div></ha-card
      >`;const e=t.attributes,i=this._config.name??e.friendly_name??this._config.entity,s="unavailable"===t.state||"unknown"===t.state,r=this.hass.config?.unit_system?.temperature??"°C",o=this._colorMode();return B`
      <ha-card style=${`--mt-active-color: ${At(o)}`}>
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
          .mode=${o}
          .modeLabel=${s?"Unavailable":Et(t.state)}
          .unit=${r}
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
            </div>`:K}
      </ha-card>
    `}disconnectedCallback(){super.disconnectedCallback(),this._debounceTimer&&window.clearTimeout(this._debounceTimer)}};Rt.styles=[wt,a`
      ha-card {
        padding: 12px 16px 20px;
        border-radius: var(--mt-shape-card);
        overflow: hidden;
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
    `],t([mt({attribute:!1})],Rt.prototype,"hass",void 0),t([ft()],Rt.prototype,"_config",void 0),t([ft()],Rt.prototype,"_selectedTemp",void 0),Rt=t([dt($t)],Rt);let Ht=class extends lt{_values(){const t=this.hass?.states?.[this.entityId]?.attributes;return t?"hvac"===this.kind?t.hvac_modes??[]:"fan"===this.kind?t.fan_modes??[]:t.swing_modes??[]:[]}_override(t){return this.feature.options?.find(e=>e.value===t)}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setOverride(t,e){const i=[...this.feature.options??[]],s=i.findIndex(e=>e.value===t),r={...s>=0?i[s]:{value:t},...e};""===r.label&&delete r.label,""===r.icon&&delete r.icon,r.hide||delete r.hide;const o=void 0!==r.label||void 0!==r.icon||!!r.hide;s>=0?o?i[s]=r:i.splice(s,1):o&&i.push(r),this._emit({options:i})}render(){const t=this._values(),e=this.feature.display??"icons";return B`
      <div class="editor">
        <ha-select
          label="Display"
          .value=${e}
          naturalMenuWidth
          fixedMenuPosition
          @selected=${t=>{const i=t.target?.value;i&&i!==e&&this._emit({display:i})}}
          @closed=${t=>t.stopPropagation()}
        >
          <ha-list-item value="icons">Icons</ha-list-item>
          <ha-list-item value="dropdown">Dropdown</ha-list-item>
        </ha-select>

        ${0===t.length?B`<p class="hint">
              Pick a climate entity that exposes ${this.kind} options to customize them.
            </p>`:B`<div class="options">
              ${t.map(t=>this._renderOption(t))}
            </div>`}
      </div>
    `}_renderOption(t){const e=this._override(t),i=!!e?.hide;return B`
      <div class="opt">
        <div class="opt-name" title=${t}>${Et(t)}</div>
        <ha-textfield
          class="opt-label"
          label="Label"
          .value=${e?.label??""}
          .placeholder=${Et(t)}
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
    `}};Ht.styles=a`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 4px 0;
    }
    ha-select {
      width: 100%;
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
  `,t([mt({attribute:!1})],Ht.prototype,"hass",void 0),t([mt()],Ht.prototype,"entityId",void 0),t([mt()],Ht.prototype,"kind",void 0),t([mt({attribute:!1})],Ht.prototype,"feature",void 0),Ht=t([dt("mt-climate-feature-editor")],Ht);const Nt=[{name:"entity",selector:{entity:{domain:"climate"}}},{name:"name",selector:{text:{}}},{name:"theme",selector:{theme:{}}},{name:"show_current_as_primary",selector:{boolean:{}}}],Dt=[{type:"climate-hvac-modes",label:"Climate HVAC modes"},{type:"climate-fan-modes",label:"Climate fan modes"},{type:"climate-swing-modes",label:"Climate swing modes"}],Lt={"climate-hvac-modes":"Climate HVAC modes","climate-fan-modes":"Climate fan modes","climate-swing-modes":"Climate swing modes","input-select":"Input select","switch-group":"Switch group","switch-list":"Switch list","button-list":"Button list","entity-tile":"Entity tile"};let Ft=class extends lt{constructor(){super(...arguments),this._editingIndex=null,this._computeLabel=t=>{switch(t.name){case"entity":return"Climate entity (required)";case"name":return"Name";case"theme":return"Theme";case"show_current_as_primary":return"Show current temperature as primary information";default:return t.name}}}setConfig(t){this._config=t}get _baseData(){return{entity:this._config.entity,name:this._config.name,theme:this._config.theme,show_current_as_primary:this._config.show_current_as_primary??!1}}_emit(t){this._config=t,yt(this,"config-changed",{config:t})}_baseChanged(t){const e=t.detail.value,i={...this._config,entity:e.entity,name:e.name||void 0,theme:e.theme||void 0,show_current_as_primary:e.show_current_as_primary||void 0};this._emit(i)}get _features(){return this._config.features??[]}_setFeatures(t){this._emit({...this._config,features:t})}_addFeature(t){const e=Dt[t.detail.index]?.type;if(!e)return;const i={type:e};this._setFeatures([...this._features,i]),this._editingIndex=this._features.length}_removeFeature(t){const e=[...this._features];e.splice(t,1),this._editingIndex=null,this._setFeatures(e)}_moveFeature(t){const{oldIndex:e,newIndex:i}=t.detail,s=[...this._features],[r]=s.splice(e,1);s.splice(i,0,r),this._editingIndex=null,this._setFeatures(s)}_featureChanged(t,e){const i=[...this._features];i[t]=e.detail.feature,this._setFeatures(i)}render(){return this._config&&this.hass?B`
      <div class="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._baseData}
          .schema=${Nt}
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

        <ha-button-menu fixed @action=${this._addFeature}>
          <ha-button slot="trigger">
            <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
            Add feature
          </ha-button>
          ${Dt.map(t=>B`<ha-list-item .value=${t.type}>${t.label}</ha-list-item>`)}
        </ha-button-menu>
      </div>
    `:B``}_renderFeatureRow(t,e){const i=this._editingIndex===e;return B`
      <div class="feature">
        <div class="feature-head">
          <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
          <div class="feature-title">${Lt[t.type]??t.type}</div>
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
        ${i?this._renderFeatureEditor(t,e):K}
      </div>
    `}_renderFeatureEditor(t,e){const i="climate-hvac-modes"===t.type?"hvac":"climate-fan-modes"===t.type?"fan":"climate-swing-modes"===t.type?"swing":null;return i?B`<div class="feature-editor">
        <mt-climate-feature-editor
          .hass=${this.hass}
          .entityId=${this._config.entity}
          kind=${i}
          .feature=${t}
          @feature-changed=${t=>this._featureChanged(e,t)}
        ></mt-climate-feature-editor>
      </div>`:B`<div class="feature-editor">
      <p class="hint">This feature type has no visual editor yet — coming in a later release.</p>
    </div>`}};Ft.styles=a`
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
    ha-button-menu ha-button {
      --mdc-theme-primary: var(--primary-color);
    }
  `,t([mt({attribute:!1})],Ft.prototype,"hass",void 0),t([ft()],Ft.prototype,"_config",void 0),t([ft()],Ft.prototype,"_editingIndex",void 0),Ft=t([dt(bt)],Ft);var Vt=Object.freeze({__proto__:null,get MaterialThermostatCardEditor(){return Ft}});export{Rt as MaterialThermostatCard};
