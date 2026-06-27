function t(t,e,i,s){var a,o=arguments.length,r=o<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,s);else for(var n=t.length-1;n>=0;n--)(a=t[n])&&(r=(o<3?a(r):o>3?a(e,i,r):a(e,i))||r);return o>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),a=new WeakMap;let o=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=a.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&a.set(e,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new o(i,t,s)},n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,v=m.trustedTypes,f=v?v.emptyScript:"",g=m.reactiveElementPolyfillSupport,_=(t,e)=>t,b={toAttribute(t,e){switch(e){case Boolean:t=t?f:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!l(t,e),w={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=w){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:a}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const o=s?.call(this);a?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??w}static _$Ei(){if(this.hasOwnProperty(_("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(_("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_("properties"))){const t=this.properties,e=[...h(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),a=e.litNonce;void 0!==a&&s.setAttribute("nonce",a),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const a=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(e,i.type);this._$Em=t,null==a?this.removeAttribute(s):this.setAttribute(s,a),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),a="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:b;this._$Em=s;const o=a.fromAttribute(e,t.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i,s=!1,a){if(void 0!==t){const o=this.constructor;if(!1===s&&(a=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??y)(a,e)||i.useDefault&&i.reflect&&a===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:a},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==a||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[_("elementProperties")]=new Map,$[_("finalized")]=new Map,g?.({ReactiveElement:$}),(m.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,A=t=>t,L=x.trustedTypes,k=L?L.createPolicy("lit-html",{createHTML:t=>t}):void 0,M="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,S="?"+C,E=`<${S}>`,O=document,Z=()=>O.createComment(""),z=t=>null===t||"object"!=typeof t&&"function"!=typeof t,P=Array.isArray,I="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,H=/-->/g,D=/>/g,R=RegExp(`>|${I}(?:([^\\s"'>=/]+)(${I}*=${I}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),U=/'/g,j=/"/g,N=/^(?:script|style|textarea|title)$/i,V=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),F=V(1),q=V(2),B=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),K=new WeakMap,X=O.createTreeWalker(O,129);function Y(t,e){if(!P(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(e):e}const G=(t,e)=>{const i=t.length-1,s=[];let a,o=2===e?"<svg>":3===e?"<math>":"",r=T;for(let e=0;e<i;e++){const i=t[e];let n,l,c=-1,d=0;for(;d<i.length&&(r.lastIndex=d,l=r.exec(i),null!==l);)d=r.lastIndex,r===T?"!--"===l[1]?r=H:void 0!==l[1]?r=D:void 0!==l[2]?(N.test(l[2])&&(a=RegExp("</"+l[2],"g")),r=R):void 0!==l[3]&&(r=R):r===R?">"===l[0]?(r=a??T,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,n=l[1],r=void 0===l[3]?R:'"'===l[3]?j:U):r===j||r===U?r=R:r===H||r===D?r=T:(r=R,a=void 0);const h=r===R&&t[e+1].startsWith("/>")?" ":"";o+=r===T?i+E:c>=0?(s.push(n),i.slice(0,c)+M+i.slice(c)+C+h):i+C+(-2===c?e:h)}return[Y(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class J{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let a=0,o=0;const r=t.length-1,n=this.parts,[l,c]=G(t,e);if(this.el=J.createElement(l,i),X.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=X.nextNode())&&n.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(M)){const e=c[o++],i=s.getAttribute(t).split(C),r=/([.?@])?(.*)/.exec(e);n.push({type:1,index:a,name:r[2],strings:i,ctor:"."===r[1]?st:"?"===r[1]?at:"@"===r[1]?ot:it}),s.removeAttribute(t)}else t.startsWith(C)&&(n.push({type:6,index:a}),s.removeAttribute(t));if(N.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=L?L.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],Z()),X.nextNode(),n.push({type:2,index:++a});s.append(t[e],Z())}}}else if(8===s.nodeType)if(s.data===S)n.push({type:2,index:a});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)n.push({type:7,index:a}),t+=C.length-1}a++}}static createElement(t,e){const i=O.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,s){if(e===B)return e;let a=void 0!==s?i._$Co?.[s]:i._$Cl;const o=z(e)?void 0:e._$litDirective$;return a?.constructor!==o&&(a?._$AO?.(!1),void 0===o?a=void 0:(a=new o(t),a._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=a:i._$Cl=a),void 0!==a&&(e=Q(t,a._$AS(t,e.values),a,s)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??O).importNode(e,!0);X.currentNode=s;let a=X.nextNode(),o=0,r=0,n=i[0];for(;void 0!==n;){if(o===n.index){let e;2===n.type?e=new et(a,a.nextSibling,this,t):1===n.type?e=new n.ctor(a,n.name,n.strings,this,t):6===n.type&&(e=new rt(a,this,t)),this._$AV.push(e),n=i[++r]}o!==n?.index&&(a=X.nextNode(),o++)}return X.currentNode=O,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),z(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==B&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>P(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&z(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(Y(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new tt(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=K.get(t.strings);return void 0===e&&K.set(t.strings,e=new J(t)),e}k(t){P(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const a of t)s===e.length?e.push(i=new et(this.O(Z()),this.O(Z()),this,this.options)):i=e[s],i._$AI(a),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class it{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,a){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=a,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(t,e=this,i,s){const a=this.strings;let o=!1;if(void 0===a)t=Q(this,t,e,0),o=!z(t)||t!==this._$AH&&t!==B,o&&(this._$AH=t);else{const s=t;let r,n;for(t=a[0],r=0;r<a.length-1;r++)n=Q(this,s[i+r],e,r),n===B&&(n=this._$AH[r]),o||=!z(n)||n!==this._$AH[r],n===W?t=W:t!==W&&(t+=(n??"")+a[r+1]),this._$AH[r]=n}o&&!s&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class at extends it{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class ot extends it{constructor(t,e,i,s,a){super(t,e,i,s,a),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??W)===B)return;const i=this._$AH,s=t===W&&i!==W||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,a=t!==W&&(i===W||s);s&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const nt=x.litHtmlPolyfillSupport;nt?.(J,et),(x.litHtmlVersions??=[]).push("3.3.3");const lt=globalThis;let ct=class extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let a=s._$litPart$;if(void 0===a){const t=i?.renderBefore??null;s._$litPart$=a=new et(e.insertBefore(Z(),t),t,void 0,i??{})}return a._$AI(t),a})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return B}};ct._$litElement$=!0,ct.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ct});const dt=lt.litElementPolyfillSupport;dt?.({LitElement:ct}),(lt.litElementVersions??=[]).push("4.2.2");const ht=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:y},ut=(t=pt,e,i)=>{const{kind:s,metadata:a}=i;let o=globalThis.litPropertyMetadata.get(a);if(void 0===o&&globalThis.litPropertyMetadata.set(a,o=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const a=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,a,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const a=this[s];e.call(this,i),this.requestUpdate(s,a,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function mt(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function vt(t){return mt({...t,state:!0,attribute:!1})}function ft(t,e){return(e,i,s)=>((t,e,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof e&&Object.defineProperty(t,e,i),i))(e,i,{get(){return e=this,e.renderRoot?.querySelector(t)??null;var e}})}var gt,_t;function bt(){return(bt=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var s in i)Object.prototype.hasOwnProperty.call(i,s)&&(t[s]=i[s])}return t}).apply(this,arguments)}!function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(gt||(gt={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(_t||(_t={}));var yt=function(t,e,i,s){s=s||{},i=null==i?{}:i;var a=new Event(e,{bubbles:void 0===s.bubbles||s.bubbles,cancelable:Boolean(s.cancelable),composed:void 0===s.composed||s.composed});return a.detail=i,t.dispatchEvent(a),a};const wt=t=>(...e)=>({_$litDirective$:t,values:e});let $t=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};const xt="important",At=" !"+xt,Lt=wt(class extends $t{constructor(t){if(super(t),1!==t.type||"style"!==t.name||t.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(t){return Object.keys(t).reduce((e,i)=>{const s=t[i];return null==s?e:e+`${i=i.includes("-")?i:i.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${s};`},"")}update(t,[e]){const{style:i}=t.element;if(void 0===this.ft)return this.ft=new Set(Object.keys(e)),this.render(e);for(const t of this.ft)null==e[t]&&(this.ft.delete(t),t.includes("-")?i.removeProperty(t):i[t]=null);for(const t in e){const s=e[t];if(null!=s){this.ft.add(t);const e="string"==typeof s&&s.endsWith(At);t.includes("-")||e?i.setProperty(t,e?s.slice(0,-11):s,e?xt:""):i[t]=s}}return B}}),kt="material-thermostat-card",Mt="material-thermostat-card-editor",Ct=100,St=r`
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

    /* Motion — prefer Material You theme motion tokens, fall back to M3 defaults. */
    --mt-motion-dur: var(--md-sys-motion-duration-medium2, 280ms);
    --mt-motion-ease: var(--md-sys-motion-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
  }
`,Et={off:"mdi:power",heat:"mdi:fire",cool:"mdi:snowflake",heat_cool:"mdi:sun-snowflake-variant",auto:"mdi:thermostat-auto",dry:"mdi:water-percent",fan_only:"mdi:fan"};function Ot(t){switch(t){case"cool":return"var(--state-climate-cool-color, #2b9af9)";case"heat":return"var(--state-climate-heat-color, #ff8100)";case"heat_cool":return"var(--state-climate-heat_cool-color, #009688)";case"auto":return"var(--state-climate-auto-color, #e5c454)";case"dry":return"var(--state-climate-dry-color, #efbd07)";case"fan_only":return"var(--state-climate-fan_only-color, #8a8a8a)";default:return"var(--state-climate-off-color, var(--mt-on-surface-variant))"}}function Zt(t,e){if(!e?.length)return t;const i=new Set(t),s=e.filter(t=>i.has(t)),a=new Set(s);return[...s,...t.filter(t=>!a.has(t))]}function zt(t){return"heat_cool"===t?"Heat/Cool":t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}const Pt={"swing-vertical-fixed-top":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM20.444 6.827A16 16 0 0 1 19.746 9.756L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268Z",secondary:"M19.295 10.929A16 16 0 0 1 17.849 13.57L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM17.104 14.582A16 16 0 0 1 15.012 16.748L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM14.027 17.528A16 16 0 0 1 11.438 19.065L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM10.282 19.557A16 16 0 0 1 7.378 20.357L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z"},"swing-vertical-fixed-upper-middle":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM19.295 10.929A16 16 0 0 1 17.849 13.57L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499Z",secondary:"M20.444 6.827A16 16 0 0 1 19.746 9.756L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM17.104 14.582A16 16 0 0 1 15.012 16.748L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM14.027 17.528A16 16 0 0 1 11.438 19.065L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM10.282 19.557A16 16 0 0 1 7.378 20.357L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z"},"swing-vertical-fixed-middle":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM17.104 14.582A16 16 0 0 1 15.012 16.748L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595Z",secondary:"M20.444 6.827A16 16 0 0 1 19.746 9.756L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM19.295 10.929A16 16 0 0 1 17.849 13.57L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM14.027 17.528A16 16 0 0 1 11.438 19.065L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM10.282 19.557A16 16 0 0 1 7.378 20.357L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z"},"swing-vertical-fixed-lower-middle":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM14.027 17.528A16 16 0 0 1 11.438 19.065L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478Z",secondary:"M20.444 6.827A16 16 0 0 1 19.746 9.756L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM19.295 10.929A16 16 0 0 1 17.849 13.57L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM17.104 14.582A16 16 0 0 1 15.012 16.748L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM10.282 19.557A16 16 0 0 1 7.378 20.357L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z"},"swing-vertical-fixed-bottom":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM10.282 19.557A16 16 0 0 1 7.378 20.357L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z",secondary:"M20.444 6.827A16 16 0 0 1 19.746 9.756L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM19.295 10.929A16 16 0 0 1 17.849 13.57L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM17.104 14.582A16 16 0 0 1 15.012 16.748L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM14.027 17.528A16 16 0 0 1 11.438 19.065L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478Z"},"swing-vertical-top":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM17.077 6.354A12.6 12.6 0 0 1 16.528 8.661L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM16.172 9.584A12.6 12.6 0 0 1 15.034 11.664L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM14.447 12.461A12.6 12.6 0 0 1 12.8 14.167L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM19.935 9.505A16.1 16.1 0 0 1 16.994 14.876L15.762 13.855A14.5 14.5 0 0 0 18.411 9.017ZM19.965 6.785L21.268 9.931L17.077 8.591ZM14.719 16.367L14.684 12.961L18.072 15.77Z",secondary:"M12.024 14.781A12.6 12.6 0 0 1 9.985 15.991L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM9.074 16.379A12.6 12.6 0 0 1 6.788 17.009L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z"},"swing-vertical-middle":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM16.172 9.584A12.6 12.6 0 0 1 15.034 11.664L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM14.447 12.461A12.6 12.6 0 0 1 12.8 14.167L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM12.024 14.781A12.6 12.6 0 0 1 9.985 15.991L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM18.097 13.377A16.1 16.1 0 0 1 13.843 17.782L12.924 16.472A14.5 14.5 0 0 0 16.756 12.505ZM18.844 10.762L19.271 14.141L15.582 11.742ZM11.255 18.62L12.121 15.326L14.647 18.929Z",secondary:"M17.077 6.354A12.6 12.6 0 0 1 16.528 8.661L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM9.074 16.379A12.6 12.6 0 0 1 6.788 17.009L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z"},"swing-vertical-bottom":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM14.447 12.461A12.6 12.6 0 0 1 12.8 14.167L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM12.024 14.781A12.6 12.6 0 0 1 9.985 15.991L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM9.074 16.379A12.6 12.6 0 0 1 6.788 17.009L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087ZM15.303 16.628A16.1 16.1 0 0 1 10.037 19.754L9.497 18.248A14.5 14.5 0 0 0 14.239 15.432ZM16.713 14.302L16.233 17.674L13.308 14.387ZM7.319 19.879L9.024 16.93L10.51 21.072Z",secondary:"M17.077 6.354A12.6 12.6 0 0 1 16.528 8.661L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM16.172 9.584A12.6 12.6 0 0 1 15.034 11.664L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499Z"},"swing-vertical-full":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM17.077 6.354A12.6 12.6 0 0 1 16.528 8.661L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM16.172 9.584A12.6 12.6 0 0 1 15.034 11.664L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM14.447 12.461A12.6 12.6 0 0 1 12.8 14.167L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM12.024 14.781A12.6 12.6 0 0 1 9.985 15.991L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM9.074 16.379A12.6 12.6 0 0 1 6.788 17.009L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087ZM19.935 9.505A16.1 16.1 0 0 1 10.037 19.754L9.497 18.248A14.5 14.5 0 0 0 18.411 9.017ZM19.965 6.785L21.268 9.931L17.077 8.591ZM7.319 19.879L9.024 16.93L10.51 21.072Z"},"swing-horizontal-fixed-left":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM5.188 19.477A16 16 0 0 1 2.595 17.944L9.649 8.236A4 4 0 0 0 10.297 8.619Z",secondary:"M9.249 20.762A16 16 0 0 1 6.344 19.967L10.586 8.742A4 4 0 0 0 11.312 8.94ZM13.506 20.929A16 16 0 0 1 10.494 20.929L11.624 8.982A4 4 0 0 0 12.376 8.982ZM17.656 19.967A16 16 0 0 1 14.751 20.762L12.688 8.94A4 4 0 0 0 13.414 8.742ZM21.405 17.944A16 16 0 0 1 18.812 19.477L13.703 8.619A4 4 0 0 0 14.351 8.236Z"},"swing-horizontal-fixed-left-middle":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM9.249 20.762A16 16 0 0 1 6.344 19.967L10.586 8.742A4 4 0 0 0 11.312 8.94Z",secondary:"M5.188 19.477A16 16 0 0 1 2.595 17.944L9.649 8.236A4 4 0 0 0 10.297 8.619ZM13.506 20.929A16 16 0 0 1 10.494 20.929L11.624 8.982A4 4 0 0 0 12.376 8.982ZM17.656 19.967A16 16 0 0 1 14.751 20.762L12.688 8.94A4 4 0 0 0 13.414 8.742ZM21.405 17.944A16 16 0 0 1 18.812 19.477L13.703 8.619A4 4 0 0 0 14.351 8.236Z"},"swing-horizontal-fixed-middle":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM13.506 20.929A16 16 0 0 1 10.494 20.929L11.624 8.982A4 4 0 0 0 12.376 8.982Z",secondary:"M5.188 19.477A16 16 0 0 1 2.595 17.944L9.649 8.236A4 4 0 0 0 10.297 8.619ZM9.249 20.762A16 16 0 0 1 6.344 19.967L10.586 8.742A4 4 0 0 0 11.312 8.94ZM17.656 19.967A16 16 0 0 1 14.751 20.762L12.688 8.94A4 4 0 0 0 13.414 8.742ZM21.405 17.944A16 16 0 0 1 18.812 19.477L13.703 8.619A4 4 0 0 0 14.351 8.236Z"},"swing-horizontal-fixed-right-middle":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM17.656 19.967A16 16 0 0 1 14.751 20.762L12.688 8.94A4 4 0 0 0 13.414 8.742Z",secondary:"M5.188 19.477A16 16 0 0 1 2.595 17.944L9.649 8.236A4 4 0 0 0 10.297 8.619ZM9.249 20.762A16 16 0 0 1 6.344 19.967L10.586 8.742A4 4 0 0 0 11.312 8.94ZM13.506 20.929A16 16 0 0 1 10.494 20.929L11.624 8.982A4 4 0 0 0 12.376 8.982ZM21.405 17.944A16 16 0 0 1 18.812 19.477L13.703 8.619A4 4 0 0 0 14.351 8.236Z"},"swing-horizontal-fixed-right":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM21.405 17.944A16 16 0 0 1 18.812 19.477L13.703 8.619A4 4 0 0 0 14.351 8.236Z",secondary:"M5.188 19.477A16 16 0 0 1 2.595 17.944L9.649 8.236A4 4 0 0 0 10.297 8.619ZM9.249 20.762A16 16 0 0 1 6.344 19.967L10.586 8.742A4 4 0 0 0 11.312 8.94ZM13.506 20.929A16 16 0 0 1 10.494 20.929L11.624 8.982A4 4 0 0 0 12.376 8.982ZM17.656 19.967A16 16 0 0 1 14.751 20.762L12.688 8.94A4 4 0 0 0 13.414 8.742Z"},"swing-horizontal-left":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM6.635 16.401A12.6 12.6 0 0 1 4.594 15.194L9.649 8.236A4 4 0 0 0 10.297 8.619ZM9.834 17.412A12.6 12.6 0 0 1 7.546 16.787L10.586 8.742A4 4 0 0 0 11.312 8.94ZM13.186 17.544A12.6 12.6 0 0 1 10.814 17.544L11.624 8.982A4 4 0 0 0 12.376 8.982ZM10.783 21.054A16.1 16.1 0 0 1 4.876 19.438L5.584 18.003A14.5 14.5 0 0 0 10.904 19.458ZM13.436 20.453L10.677 22.45L11.009 18.062ZM2.898 17.57L6.203 16.748L4.256 20.693Z",secondary:"M16.454 16.787A12.6 12.6 0 0 1 14.166 17.412L12.688 8.94A4 4 0 0 0 13.414 8.742ZM19.406 15.194A12.6 12.6 0 0 1 17.365 16.401L13.703 8.619A4 4 0 0 0 14.351 8.236Z"},"swing-horizontal-middle":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM9.834 17.412A12.6 12.6 0 0 1 7.546 16.787L10.586 8.742A4 4 0 0 0 11.312 8.94ZM13.186 17.544A12.6 12.6 0 0 1 10.814 17.544L11.624 8.982A4 4 0 0 0 12.376 8.982ZM16.454 16.787A12.6 12.6 0 0 1 14.166 17.412L12.688 8.94A4 4 0 0 0 13.414 8.742ZM15.062 20.806A16.1 16.1 0 0 1 8.938 20.806L9.242 19.235A14.5 14.5 0 0 0 14.758 19.235ZM17.462 19.526L15.328 22.181L14.491 17.861ZM6.538 19.526L9.509 17.861L8.672 22.181Z",secondary:"M6.635 16.401A12.6 12.6 0 0 1 4.594 15.194L9.649 8.236A4 4 0 0 0 10.297 8.619ZM19.406 15.194A12.6 12.6 0 0 1 17.365 16.401L13.703 8.619A4 4 0 0 0 14.351 8.236Z"},"swing-horizontal-right":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM13.186 17.544A12.6 12.6 0 0 1 10.814 17.544L11.624 8.982A4 4 0 0 0 12.376 8.982ZM16.454 16.787A12.6 12.6 0 0 1 14.166 17.412L12.688 8.94A4 4 0 0 0 13.414 8.742ZM19.406 15.194A12.6 12.6 0 0 1 17.365 16.401L13.703 8.619A4 4 0 0 0 14.351 8.236ZM19.124 19.438A16.1 16.1 0 0 1 13.217 21.054L13.096 19.458A14.5 14.5 0 0 0 18.416 18.003ZM21.102 17.57L19.744 20.693L17.797 16.748ZM10.564 20.453L12.991 18.062L13.323 22.45Z",secondary:"M6.635 16.401A12.6 12.6 0 0 1 4.594 15.194L9.649 8.236A4 4 0 0 0 10.297 8.619ZM9.834 17.412A12.6 12.6 0 0 1 7.546 16.787L10.586 8.742A4 4 0 0 0 11.312 8.94Z"},"swing-horizontal-full":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM6.635 16.401A12.6 12.6 0 0 1 4.594 15.194L9.649 8.236A4 4 0 0 0 10.297 8.619ZM9.834 17.412A12.6 12.6 0 0 1 7.546 16.787L10.586 8.742A4 4 0 0 0 11.312 8.94ZM13.186 17.544A12.6 12.6 0 0 1 10.814 17.544L11.624 8.982A4 4 0 0 0 12.376 8.982ZM16.454 16.787A12.6 12.6 0 0 1 14.166 17.412L12.688 8.94A4 4 0 0 0 13.414 8.742ZM19.406 15.194A12.6 12.6 0 0 1 17.365 16.401L13.703 8.619A4 4 0 0 0 14.351 8.236ZM19.124 19.438A16.1 16.1 0 0 1 4.876 19.438L5.584 18.003A14.5 14.5 0 0 0 18.416 18.003ZM21.102 17.57L19.744 20.693L17.797 16.748ZM2.898 17.57L6.203 16.748L4.256 20.693Z"}},It=wt(class extends $t{constructor(t){if(super(t),1!==t.type||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(e=>t[e]).join(" ")+" "}update(t,[e]){if(void 0===this.st){this.st=new Set,void 0!==t.strings&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter(t=>""!==t)));for(const t in e)e[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(e)}const i=t.element.classList;for(const t of this.st)t in e||(i.remove(t),this.st.delete(t));for(const t in e){const s=!!e[t];s===this.st.has(t)||this.nt?.has(t)||(s?(i.add(t),this.st.add(t)):(i.remove(t),this.st.delete(t)))}return B}});var Tt;try{CSS.registerProperty?.({name:"--dial-color",syntax:"<color>",inherits:!0,initialValue:"transparent"})}catch{}const Ht=["cool","heat","heat_cool","auto","dry","fan_only"],Dt=160,Rt=225,Ut=270;function jt(t,e){const i=(t-90)*Math.PI/180;return{x:Dt+e*Math.cos(i),y:Dt+e*Math.sin(i)}}let Nt=Tt=class extends ct{constructor(){super(...arguments),this.value=20,this.min=7,this.max=35,this.step=.5,this.mode="off",this.modeLabel="",this.unit="°C",this.showCurrentAsPrimary=!1,this.disabled=!1,this.dual=!1,this._dragging=!1,this._dragValue=0,this._dragLow=0,this._dragHigh=0,this._activeHandle=null,this._wipeFrom=null,this._prevOff=!1,this._showRangeTimer=!1,this._onPointerDown=t=>{if(this.disabled||!this._isRingHit(t.clientX,t.clientY))return;t.preventDefault(),this._svg.setPointerCapture(t.pointerId);const e=this._displayLow,i=this._displayHigh;this._dragging=!0;const s=this._valueFromPoint(t.clientX,t.clientY);this.dual&&(this._dragLow=e,this._dragHigh=i,this._activeHandle=Math.abs(s-this._dragLow)<=Math.abs(s-this._dragHigh)?"low":"high"),this._emitFromValue(s)},this._onPointerMove=t=>{this._dragging&&this._emitFromValue(this._valueFromPoint(t.clientX,t.clientY))},this._onPointerUp=t=>{this._dragging&&(this._svg.releasePointerCapture(t.pointerId),this._dragging=!1,this.dual?(this._emit("value-changed",{low:this._dragLow,high:this._dragHigh}),this._activeHandle=null):this._emit("value-changed",{value:this._dragValue}))},this._onKeyDown=t=>{if(this.disabled||this.dual)return;let e;"ArrowUp"===t.key||"ArrowRight"===t.key?e=this.value+this.step:"ArrowDown"!==t.key&&"ArrowLeft"!==t.key||(e=this.value-this.step),void 0!==e&&(t.preventDefault(),this._emit("value-changed",{value:this._roundToStep(e)}))}}get _dualActive(){return this.dual&&null!=this.current?this.current>this._displayHigh?"cool":this.current<this._displayLow?"heat":null:null}get _effectiveMode(){return this.dual?this._dualActive??"heat_cool":this.mode}get _demandSensible(){return null!=this.current&&("cool"===this.mode?this.current>this._displayValue:"heat"!==this.mode||this.current<this._displayValue)}get _dialColor(){return Ht.includes(this._effectiveMode)?Ot(this._effectiveMode):Tt.IDLE_COLOR}get _showRange(){return this._dragging||this._showRangeTimer||null===this._dualActive}_bumpRangeDisplay(){this._showRangeTimer=!0,this._rangeTimer&&clearTimeout(this._rangeTimer),this._rangeTimer=window.setTimeout(()=>{this._showRangeTimer=!1},5e3)}disconnectedCallback(){super.disconnectedCallback(),this._rangeTimer&&clearTimeout(this._rangeTimer)}get _precision(){return this.step<1?1:0}get _displayValue(){return this._dragging?this._dragValue:this.value}get _displayLow(){return this._dragging?this._dragLow:this.lowValue??this.min}get _displayHigh(){return this._dragging?this._dragHigh:this.highValue??this.max}_angleOf(t){const e=(t-this.min)/(this.max-this.min||1);return Rt+Math.min(1,Math.max(0,e))*Ut}_fracOf(t){return(this._angleOf(t)-Rt)/Ut}_roundToStep(t){const e=Math.min(this.max,Math.max(this.min,t)),i=Math.round(e/this.step)*this.step;return parseFloat(i.toFixed(this._precision))}_isRingHit(t,e){const i=this._svg.getBoundingClientRect(),s=i.width/320||1,a=t-(i.left+i.width/2),o=e-(i.top+i.height/2),r=Math.hypot(a,o)/s;if(r<98||r>152)return!1;let n=180*Math.atan2(o,a)/Math.PI+90;return n=(n%360+360)%360,n>=Rt||n<=135}_valueFromPoint(t,e){const i=this._svg.getBoundingClientRect(),s=i.left+i.width/2,a=i.top+i.height/2;let o,r=180*Math.atan2(e-a,t-s)/Math.PI+90;r=(r%360+360)%360,o=r>=Rt?r-Rt:r<=135?r+360-Rt:r<180?Ut:0;const n=Math.min(1,Math.max(0,o/Ut));return this._roundToStep(this.min+n*(this.max-this.min))}_applyDual(t){"low"===this._activeHandle?this._dragLow=Math.min(t,this._dragHigh-this.step):this._dragHigh=Math.max(t,this._dragLow+this.step)}_emitFromValue(t){this.dual?(this._applyDual(t),this._emit("value-changing",{low:this._dragLow,high:this._dragHigh})):(this._dragValue=t,this._emit("value-changing",{value:t}))}_step(t){this.disabled||this._emit("value-changed",{value:this._roundToStep(this.value+t*this.step)})}_emit(t,e){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}_fmt(t,e){return null==t||Number.isNaN(t)?"—":t.toFixed(e)}_fmtCompact(t){return null==t||Number.isNaN(t)?"—":Number.isInteger(t)?String(t):t.toFixed(1)}_dotOrbit(t,e){return F`<div class="orbit" style=${`transform: rotate(${t}deg)`}>
      <div class="o-dot ${e}"></div>
    </div>`}_labelOrbit(t,e){return F`<div class="orbit" style=${`transform: rotate(${t}deg)`}>
      <div class="o-label" style=${`transform: translate(-50%, -50%) rotate(${-t}deg)`}>
        ${e}
      </div>
    </div>`}updated(t){if(this.dual&&(t.has("lowValue")||t.has("highValue"))&&((void 0!==this._prevLow&&this._prevLow!==this.lowValue||void 0!==this._prevHigh&&this._prevHigh!==this.highValue)&&this._bumpRangeDisplay(),this._prevLow=this.lowValue,this._prevHigh=this.highValue),!t.has("mode"))return;const e=this._dialColor,i=!Ht.includes(this.mode);this.dual||void 0===this._prevColor||this._prevColor===e||i||this._prevOff||(this._wipeFrom=this._prevColor,this.updateComplete.then(()=>this._runWipe())),this._prevColor=e,this._prevOff=i}_runWipe(){const t=this.renderRoot.querySelector(".value:not(.wipe-value)"),e=this.renderRoot.querySelector(".wipe-value"),i=()=>{this._wipeFrom=null};if(!t||!e)return i();const s=parseFloat(t.getAttribute("stroke-dasharray")??"0"),a=-parseFloat(t.getAttribute("stroke-dashoffset")??"0");if(s<=0)return i();const o={duration:460,easing:"cubic-bezier(0.2, 0, 0, 1)"};t.animate([{strokeDasharray:"0 1000",strokeDashoffset:"0"},{strokeDasharray:`${s} 1000`,strokeDashoffset:""+-a}],o),e.animate([{strokeDasharray:`${s} 1000`,strokeDashoffset:""+-a},{strokeDasharray:`${s} 1000`,strokeDashoffset:"-1000"}],{...o,fill:"forwards"}).finished.then(i,i)}render(){const t=!Ht.includes(this.mode),e=this._dialColor,i=Et[this.mode]??"mdi:thermostat",s=null!=this.current&&this.current>=this.min&&this.current<=this.max,a=this._angleOf(this._displayValue),o=s?this._angleOf(this.current):0,r=!this.dual&&s&&!t&&Math.abs(a-o)<18,n=function(t,e,i){const s=jt(225,i),a=jt(495,i);return`M ${s.x} ${s.y} A 130 130 0 1 1 ${a.x} ${a.y}`}(0,0,130);let l=0,c=0,d=!1,h=e;this.dual||!s||t||(l=Math.min(this._fracOf(this._displayValue),this._fracOf(this.current)),c=Math.max(this._fracOf(this._displayValue),this._fracOf(this.current)),d=!0,h=this._demandSensible?e:Tt.IDLE_COLOR);const p=`${(1e3*(c-l)).toFixed(2)} 1000`,u=(1e3*-l).toFixed(2),m=[];if(this.dual){const t=this._fracOf(this._displayLow),i=this._fracOf(this._displayHigh),a=this._dualActive;if(m.push({from:t,to:i,color:null===a?e:Tt.IDLE_COLOR,idle:null!==a}),s){const e=this._fracOf(this.current);"cool"===a?m.push({from:i,to:e,color:Ot("cool")}):"heat"===a&&m.push({from:e,to:t,color:Ot("heat")})}}const v=F`<span class="num current">${this._fmtCompact(this.current)}°</span>`,f=F`<ha-icon class="mode-icon" icon=${i}></ha-icon>`;return F`
      <div
        class=${It({dial:!0,off:t,disabled:this.disabled})}
        style=${`--dial-color: ${e}`}
      >
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
          <defs>
            <!-- Soft halo: full color at the center easing smoothly out to fully
                 transparent at the perimeter (no hard edge / residual disc). -->
            <radialGradient id="mt-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="var(--dial-color)" stop-opacity="0.38" />
              <stop offset="20%" stop-color="var(--dial-color)" stop-opacity="0.3" />
              <stop offset="40%" stop-color="var(--dial-color)" stop-opacity="0.2" />
              <stop offset="60%" stop-color="var(--dial-color)" stop-opacity="0.11" />
              <stop offset="80%" stop-color="var(--dial-color)" stop-opacity="0.04" />
              <stop offset="100%" stop-color="var(--dial-color)" stop-opacity="0" />
            </radialGradient>
          </defs>
          <circle class="glow" cx=${Dt} cy=${Dt} r="150" fill="url(#mt-glow)" />
          <path class="ring" d=${n} />
          ${this.dual?m.map(t=>q`<path
                  class=${"value"+(t.idle?" idle":"")}
                  d=${n}
                  pathLength="1000"
                  stroke-dasharray=${`${(1e3*(t.to-t.from)).toFixed(2)} 1000`}
                  stroke-dashoffset=${(1e3*-t.from).toFixed(2)}
                  style=${`stroke:${t.color}`}
                />`):q`<path
                class="value"
                d=${n}
                pathLength="1000"
                stroke-dasharray=${p}
                stroke-dashoffset=${u}
                style=${`opacity:${d?1:0};stroke:${h}`}
              />`}
          <path class="hit" d=${n} />
          ${!this.dual&&this._wipeFrom&&d?q`<path
                class="value wipe-value"
                d=${n}
                pathLength="1000"
                stroke-dasharray=${p}
                stroke-dashoffset=${u}
                style=${`stroke:${this._wipeFrom};opacity:1`}
              />`:W}
        </svg>

        <div class="markers">
          ${this.dual?F`
                ${this._dotOrbit(this._angleOf(this._displayLow),"setpoint")}
                ${this._dotOrbit(this._angleOf(this._displayHigh),"setpoint")}
                ${s?this._dotOrbit(o,"current"):W}
                ${this._labelOrbit(this._angleOf(this._displayLow),F`<span class="num">${this._fmtCompact(this._displayLow)}°</span>`)}
                ${this._labelOrbit(this._angleOf(this._displayHigh),F`<span class="num">${this._fmtCompact(this._displayHigh)}°</span>`)}
                ${s?this._labelOrbit(o,v):W}
              `:F`
                ${this._dotOrbit(a,"setpoint")}
                ${s?this._dotOrbit(o,"current"):W}
                ${r?this._labelOrbit(o,F`<span class="num current with-icon"
                        ><ha-icon class="mode-icon inline" icon=${i}></ha-icon
                        >${this._fmtCompact(this.current)}°</span
                      >`):F`
                      ${t?W:this._labelOrbit(a,f)}
                      ${s?this._labelOrbit(o,v):W}
                    `}
              `}
        </div>

        ${this.dual?this._renderDualCenter():this._renderSingleCenter()}
        ${this.dual?W:this._renderAdjust()}
      </div>
    `}_renderSingleCenter(){const t=this._displayValue,e=this.showCurrentAsPrimary&&null!=this.current?this.current:t,i=this.showCurrentAsPrimary?1:this._precision;return F`
      <div class="center">
        ${this.modeLabel?F`<div class="mode">${this.modeLabel}</div>`:W}
        <div class="temp">
          <span class="value-text">${this._fmt(e,i)}</span>
          <span class="unit">${this.unit}</span>
        </div>
      </div>
    `}_renderDualCenter(){if(this._showRange)return F`
        <div class="center">
          ${this.modeLabel?F`<div class="mode">${this.modeLabel}</div>`:W}
          <div class="temp dual">
            <span class="value-text">${this._fmt(this._displayLow,this._precision)}</span>
            <span class="dash">–</span>
            <span class="value-text">${this._fmt(this._displayHigh,this._precision)}</span>
            <span class="unit">${this.unit}</span>
          </div>
        </div>
      `;const t=this._dualActive,e="cool"===t?"Cooling":"Heating",i="cool"===t?this._displayHigh:this._displayLow;return F`
      <div class="center">
        <div class="mode">${e}</div>
        <div class="temp">
          <span class="value-text">${this._fmt(i,this._precision)}</span>
          <span class="unit">${this.unit}</span>
        </div>
      </div>
    `}_renderAdjust(){return F`
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
    `}};Nt.IDLE_COLOR="var(--mt-on-surface-variant)",Nt.styles=[St,r`
      :host {
        display: block;
        /* Fill the wrapper so the dial has a DEFINITE width. A container
           (container-type below) reports zero intrinsic width, so without this
           the shrink-to-fit host would collapse to ~0 and the dial vanishes. */
        width: 100%;
      }
      .dial {
        position: relative;
        width: 100%;
        max-width: 320px;
        margin: 0 auto;
        aspect-ratio: 1 / 1;
        transition: --dial-color var(--mt-motion-dur) var(--mt-motion-ease);
        /* let inner text/markers scale with the dial via cqi units */
        container-type: inline-size;
      }
      svg {
        display: block; /* avoid inline baseline gap that offsets the SVG vs marker overlays */
        width: 100%;
        height: 100%;
        touch-action: none;
        outline: none;
      }
      .glow,
      .ring,
      .value {
        pointer-events: none;
      }
      .hit {
        fill: none;
        stroke: transparent;
        stroke-width: 50;
        stroke-linecap: butt;
        pointer-events: stroke;
        cursor: pointer;
      }
      .dial.disabled .hit {
        cursor: default;
      }
      .ring {
        fill: none;
        stroke: var(--dial-color);
        stroke-width: 10;
        stroke-linecap: round;
        opacity: 0.18;
      }
      .value {
        fill: none;
        stroke: var(--dial-color);
        stroke-width: 10;
        stroke-linecap: round;
        transition:
          stroke-dasharray var(--mt-motion-dur) var(--mt-motion-ease),
          stroke-dashoffset var(--mt-motion-dur) var(--mt-motion-ease),
          stroke var(--mt-motion-dur) var(--mt-motion-ease),
          opacity var(--mt-motion-dur) var(--mt-motion-ease);
      }
      /* The gray "range" band (between the two heat_cool setpoints) is muted so
         the colored demand band reads as the active one. */
      .value.idle {
        opacity: 0.5;
      }
      .glow {
        transition: opacity var(--mt-motion-dur) var(--mt-motion-ease);
      }
      .dial.off .glow {
        opacity: 0.5;
      }
      /* Mode-change wipe: an overlay of the OLD color value segment is laid over
         the dial — now painted in the NEW color — and slides out through the
         right end of the arc (driven by the Web Animations API in _runWipe),
         while the new color slides in from the left behind it. */
      .wipe-value {
        pointer-events: none;
        transition: none;
      }

      /* Markers orbit the center so they ride the arc and stay on the ring. */
      .markers {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .orbit {
        position: absolute;
        inset: 0;
        transform-origin: 50% 50%;
        transition: transform var(--mt-motion-dur) var(--mt-motion-ease);
      }
      .o-dot {
        position: absolute;
        left: 50%;
        top: 9.375%; /* (160-130)/320 — on the ring centerline */
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: var(--mt-on-surface);
      }
      .o-dot.setpoint {
        width: clamp(9px, 4.4cqi, 14px);
        height: clamp(9px, 4.4cqi, 14px);
      }
      .o-dot.current {
        width: clamp(7px, 3.1cqi, 10px);
        height: clamp(7px, 3.1cqi, 10px);
        opacity: 0.55;
      }
      .o-label {
        position: absolute;
        left: 50%;
        top: 18.75%; /* (160-100)/320 — just inside the ring */
        transition: transform var(--mt-motion-dur) var(--mt-motion-ease);
      }
      .o-label .num {
        font-size: clamp(8px, 4.6cqi, var(--md-sys-typescale-title-medium-size, 16px));
        font-weight: 500;
        line-height: 1;
        color: var(--mt-on-surface);
        white-space: nowrap;
      }
      .o-label .num.current {
        color: var(--mt-on-surface-variant);
      }
      /* Merged marker: temperature stays anchored at its angle; the mode icon
         hangs to its left, vertically centered. */
      .o-label .num.with-icon {
        position: relative;
      }
      .mode-icon {
        --mdc-icon-size: clamp(13px, 6.25cqi, 20px);
        color: var(--dial-color);
      }
      .mode-icon.inline {
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-right: 4px;
      }

      .center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        pointer-events: none;
        color: var(--mt-on-surface);
      }
      .mode {
        font-size: clamp(10px, 5cqi, var(--md-sys-typescale-title-medium-size, 16px));
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
        font-size: clamp(15px, 12.5cqi, var(--md-sys-typescale-display-small-size, 40px));
      }
      .temp.dual .dash {
        font-size: clamp(15px, 12.5cqi, var(--md-sys-typescale-display-small-size, 40px));
        color: var(--mt-on-surface-variant);
      }
      .value-text {
        font-size: clamp(22px, 20cqi, var(--md-sys-typescale-display-large-size, 64px));
        font-weight: 400;
        letter-spacing: -0.02em;
        color: var(--dial-color);
      }
      .unit {
        font-size: clamp(11px, 7cqi, var(--md-sys-typescale-title-large-size, 22px));
        margin-top: 0.4em;
        margin-left: 2px;
        color: var(--mt-on-surface-variant);
      }
      .temp.dual .unit {
        margin-top: 0;
        align-self: center;
      }
      .adjust {
        position: absolute;
        left: 50%;
        top: 80%;
        transform: translate(-50%, -50%);
        display: flex;
        /* gap scales with the dial (low floor) so +/- track the circle's size */
        gap: clamp(10px, 8.5cqi, 30px);
        pointer-events: none;
      }
      .step {
        /* scale with the dial; low floor so the buttons shrink with the circle
           (not pinned large) at small sizes */
        width: clamp(22px, 11cqi, 38px);
        height: clamp(22px, 11cqi, 38px);
        border-radius: var(--mt-shape-full);
        border: none;
        background: transparent;
        color: var(--mt-on-surface-variant);
        display: grid;
        place-items: center;
        cursor: pointer;
        pointer-events: auto;
        transition:
          background-color 180ms var(--mt-motion-ease),
          transform 120ms var(--mt-motion-ease);
        -webkit-tap-highlight-color: transparent;
      }
      .step ha-icon {
        --mdc-icon-size: clamp(12px, 6cqi, 22px);
      }
      .step:hover:not([disabled]) {
        background: color-mix(in srgb, var(--mt-on-surface) 8%, transparent);
      }
      .step:active:not([disabled]) {
        transform: scale(0.92);
      }
      .step[disabled] {
        opacity: 0.38;
        cursor: default;
      }
    `],t([mt({type:Number})],Nt.prototype,"value",void 0),t([mt({type:Number})],Nt.prototype,"min",void 0),t([mt({type:Number})],Nt.prototype,"max",void 0),t([mt({type:Number})],Nt.prototype,"step",void 0),t([mt({type:Number})],Nt.prototype,"current",void 0),t([mt()],Nt.prototype,"mode",void 0),t([mt()],Nt.prototype,"modeLabel",void 0),t([mt()],Nt.prototype,"unit",void 0),t([mt({type:Boolean})],Nt.prototype,"showCurrentAsPrimary",void 0),t([mt({type:Boolean})],Nt.prototype,"disabled",void 0),t([mt({type:Boolean})],Nt.prototype,"dual",void 0),t([mt({type:Number})],Nt.prototype,"lowValue",void 0),t([mt({type:Number})],Nt.prototype,"highValue",void 0),t([vt()],Nt.prototype,"_dragging",void 0),t([vt()],Nt.prototype,"_dragValue",void 0),t([vt()],Nt.prototype,"_dragLow",void 0),t([vt()],Nt.prototype,"_dragHigh",void 0),t([vt()],Nt.prototype,"_activeHandle",void 0),t([vt()],Nt.prototype,"_wipeFrom",void 0),t([vt()],Nt.prototype,"_showRangeTimer",void 0),t([ft("svg")],Nt.prototype,"_svg",void 0),Nt=Tt=t([ht("mt-circular-dial")],Nt);let Vt=class extends ct{constructor(){super(...arguments),this.items=[],this.placeholder="",this._open=!1,this._up=!1,this._alignRight=!1,this._onDocClick=t=>{this._open&&!t.composedPath().includes(this)&&(this._open=!1)},this._onOtherOpen=t=>{t.detail!==this&&(this._open=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocClick),document.addEventListener("mt-dropdown-open",this._onOtherOpen)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocClick),document.removeEventListener("mt-dropdown-open",this._onOtherOpen)}get _active(){return this.items.find(t=>t.active)??this.items[0]}_toggle(t){if(t.stopPropagation(),!this._open){const t=this.getBoundingClientRect();this._up=t.bottom>.55*window.innerHeight,this._alignRight=t.left+t.width/2>.5*window.innerWidth,document.dispatchEvent(new CustomEvent("mt-dropdown-open",{detail:this}))}this._open=!this._open}_select(t,e){t.stopPropagation(),this._open=!1,this.dispatchEvent(new CustomEvent("item-selected",{detail:{value:e}}))}render(){const t=this._active;return F`
      <button
        class=${It({trigger:!0,open:this._open})}
        aria-haspopup="listbox"
        aria-expanded=${this._open?"true":"false"}
        @click=${this._toggle}
      >
        ${t?.icon?F`<ha-icon class="lead" icon=${t.icon}></ha-icon>`:F`<span class="dot"></span>`}
        <span class="label">${t?.label??this.placeholder}</span>
        <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
      </button>
      ${this._open?F`<div
            class=${It({menu:!0,up:this._up,right:this._alignRight})}
            role="listbox"
          >
            ${this.items.map(t=>F`<button
                class=${It({opt:!0,active:!!t.active})}
                role="option"
                aria-selected=${t.active?"true":"false"}
                @click=${e=>this._select(e,t.value)}
              >
                ${t.icon?F`<ha-icon icon=${t.icon}></ha-icon>`:F`<span class="dot"></span>`}
                <span class="label">${t.label}</span>
                ${t.active?F`<ha-icon class="check" icon="mdi:check"></ha-icon>`:W}
              </button>`)}
          </div>`:W}
    `}};Vt.styles=[St,r`
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
        right: auto;
        top: calc(100% + 6px);
        z-index: 20;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 6px;
        /* at least as wide as the trigger, but grow to fit the widest option
           (so long labels aren't clipped); capped so it stays on screen */
        min-width: 100%;
        width: max-content;
        max-width: min(360px, 85vw);
        background: var(--mt-surface-container-high);
        border-radius: 20px;
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.3),
          0 1px 3px rgba(0, 0, 0, 0.2);
        max-height: 280px;
        overflow-y: auto;
        animation: mt-pop 130ms cubic-bezier(0.2, 0, 0, 1);
      }
      /* anchor to the right edge so a content-wide menu grows into the card */
      .menu.right {
        left: auto;
        right: 0;
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
    `],t([mt({attribute:!1})],Vt.prototype,"items",void 0),t([mt()],Vt.prototype,"placeholder",void 0),t([vt()],Vt.prototype,"_open",void 0),t([vt()],Vt.prototype,"_up",void 0),t([vt()],Vt.prototype,"_alignRight",void 0),Vt=t([ht("mt-dropdown")],Vt);let Ft=class extends ct{constructor(){super(...arguments),this.items=[],this.display="icons"}_select(t){this.dispatchEvent(new CustomEvent("item-selected",{detail:{value:t},bubbles:!0,composed:!0}))}render(){return this.items.length?"dropdown"===this.display?this._renderDropdown():this._renderIcons():W}_renderIcons(){return F`
      <div class="row">
        ${this.label?F`<span class="row-label">${this.label}</span>`:W}
        <div class="chips" role="group" aria-label=${this.label??"options"}>
          ${this.items.map(t=>F`
              <button
                class=${It({chip:!0,active:!!t.active})}
                ?disabled=${t.disabled}
                title=${t.label}
                aria-label=${t.label}
                aria-pressed=${t.active?"true":"false"}
                @click=${()=>this._select(t.value)}
              >
                ${t.icon?F`<ha-icon icon=${t.icon}></ha-icon>`:F`<span class="chip-text">${t.label}</span>`}
              </button>
            `)}
        </div>
      </div>
    `}_renderDropdown(){return F`<mt-dropdown
      .items=${this.items}
      .placeholder=${this.label??""}
      @item-selected=${t=>this._select(t.detail.value)}
    ></mt-dropdown>`}};Ft.styles=[St,r`
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-width: 0;
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
        justify-content: safe center;
        gap: 4px;
        padding: 4px 2px;
        background: var(--mt-surface-container);
        border-radius: var(--mt-shape-full);
        /* min-width:0 lets the pill shrink to its container instead of growing
           to its content (the default min-width:auto), so it stays inside the
           rounded container. Icons keep ~48px each on a single row; when they
           don't all fit, the row scrolls horizontally (clipped to the rounded
           shape) instead of squishing. */
        min-width: 0;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
      }
      .chips::-webkit-scrollbar {
        display: none;
      }
      .chip {
        /* Footprint 44px + 4px gap = 48px per icon. Grow to fill, capped so
           icons never over-stretch when there is spare room. */
        flex: 1 1 44px;
        height: 44px;
        min-width: 44px;
        max-width: 120px;
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
    `],t([mt({attribute:!1})],Ft.prototype,"items",void 0),t([mt()],Ft.prototype,"display",void 0),t([mt()],Ft.prototype,"label",void 0),Ft=t([ht("mt-selector-row")],Ft);let qt=class extends ct{constructor(){super(...arguments),this.kind="hvac",this.display="icons"}get _stateObj(){return this.hass?.states?.[this.entityId]}_overrideMap(){const t=new Map;return(this.options??[]).forEach(e=>t.set(e.value,e)),t}_build(){const t=this._stateObj;if(!t)return[];const e=this._overrideMap();let i,s,a=[];return"hvac"===this.kind?(a=t.attributes.hvac_modes??[],i=t.state,s=t=>Et[t]??"mdi:thermostat"):"fan"===this.kind?(a=t.attributes.fan_modes??[],i=t.attributes.fan_mode,s=t=>function(t){const e=t.toLowerCase();return e.includes("auto")?"mdi:fan-auto":e.includes("off")||"0"===e?"mdi:fan-off":/(^|[^0-9])1([^0-9]|$)|low|min|quiet|silent/.test(e)?"mdi:fan-speed-1":/(^|[^0-9])2([^0-9]|$)|mid|med/.test(e)?"mdi:fan-speed-2":/(^|[^0-9])3([^0-9]|$)|high|max|strong|turbo/.test(e)?"mdi:fan-speed-3":"mdi:fan"}(t)):(a=t.attributes.swing_modes??[],i=t.attributes.swing_mode,s=t=>function(t){const e=t.toLowerCase();return"off"===e||"stop"===e||"fixed"===e?"mdi:arrow-expand-vertical":"both"===e||"on"===e||"full"===e?"mdi:arrow-all":e.includes("horizontal")?"mdi:arrow-left-right":e.includes("vertical")?"mdi:arrow-up-down":"mdi:swap-vertical"}(t)),Zt(a,this.order).filter(t=>!e.get(t)?.hide).map(t=>({value:t,label:e.get(t)?.label??zt(t),icon:e.get(t)?.icon??s(t),active:t===i}))}_onSelect(t){const e=t.detail.value;if(!this._stateObj)return;const i=this.entityId;"hvac"===this.kind?this.hass.callService("climate","set_hvac_mode",{entity_id:i,hvac_mode:e}):"fan"===this.kind?this.hass.callService("climate","set_fan_mode",{entity_id:i,fan_mode:e}):this.hass.callService("climate","set_swing_mode",{entity_id:i,swing_mode:e})}render(){const t=this._build();return t.length?F`
      <mt-selector-row
        .items=${t}
        display=${this.display}
        @item-selected=${this._onSelect}
      ></mt-selector-row>
    `:W}};t([mt({attribute:!1})],qt.prototype,"hass",void 0),t([mt()],qt.prototype,"entityId",void 0),t([mt()],qt.prototype,"kind",void 0),t([mt()],qt.prototype,"display",void 0),t([mt({attribute:!1})],qt.prototype,"options",void 0),t([mt({attribute:!1})],qt.prototype,"order",void 0),qt=t([ht("mt-climate-selector")],qt);let Bt=class extends ct{constructor(){super(...arguments),this.display="icons"}get _stateObj(){return this.hass?.states?.[this.entity]}_overrideMap(){const t=new Map;return(this.options??[]).forEach(e=>t.set(e.value,e)),t}_build(){const t=this._stateObj;if(!t)return[];const e=this._overrideMap();return Zt(t.attributes.options??[],this.order).filter(t=>!e.get(t)?.hide).map(i=>({value:i,label:e.get(i)?.label??zt(i),icon:e.get(i)?.icon,active:i===t.state}))}_onSelect(t){this._stateObj&&this.hass.callService("input_select","select_option",{entity_id:this.entity,option:t.detail.value})}render(){const t=this._build();return t.length?F`<mt-selector-row
      .items=${t}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:W}};t([mt({attribute:!1})],Bt.prototype,"hass",void 0),t([mt()],Bt.prototype,"entity",void 0),t([mt()],Bt.prototype,"display",void 0),t([mt()],Bt.prototype,"label",void 0),t([mt({attribute:!1})],Bt.prototype,"options",void 0),t([mt({attribute:!1})],Bt.prototype,"order",void 0),Bt=t([ht("mt-input-select")],Bt);let Wt=class extends ct{constructor(){super(...arguments),this.entities=[],this.display="icons"}_build(){return(this.entities??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon,active:"on"===e?.state,disabled:!e||"unavailable"===e.state}})}async _onSelect(t){const e=t.detail.value,i=(this.entities??[]).map(t=>t.entity).filter(t=>t&&t!==e&&"on"===this.hass.states[t]?.state);i.length&&await this.hass.callService("homeassistant","turn_off",{entity_id:i}),await this.hass.callService("homeassistant","turn_on",{entity_id:e})}render(){const t=this._build();return t.length?F`<mt-selector-row
      .items=${t}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:W}};t([mt({attribute:!1})],Wt.prototype,"hass",void 0),t([mt({attribute:!1})],Wt.prototype,"entities",void 0),t([mt()],Wt.prototype,"display",void 0),t([mt()],Wt.prototype,"label",void 0),Wt=t([ht("mt-switch-group")],Wt);let Kt=class extends ct{constructor(){super(...arguments),this.entities=[]}_build(){return(this.entities??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon??"mdi:toggle-switch-variant",active:"on"===e?.state,disabled:!e||"unavailable"===e.state}})}_onSelect(t){this.hass.callService("homeassistant","toggle",{entity_id:t.detail.value})}render(){const t=this._build();return t.length?F`<mt-selector-row
      .items=${t}
      display="icons"
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:W}};function Xt(t,e,i){switch(i.split(".")[0]){case"button":e.callService("button","press",{entity_id:i});break;case"input_button":e.callService("input_button","press",{entity_id:i});break;case"scene":e.callService("scene","turn_on",{entity_id:i});break;case"script":e.callService("script","turn_on",{entity_id:i});break;case"switch":case"light":case"fan":case"input_boolean":e.callService("homeassistant","toggle",{entity_id:i});break;default:yt(t,"hass-more-info",{entityId:i})}}t([mt({attribute:!1})],Kt.prototype,"hass",void 0),t([mt({attribute:!1})],Kt.prototype,"entities",void 0),t([mt()],Kt.prototype,"label",void 0),Kt=t([ht("mt-switch-list")],Kt);let Yt=class extends ct{constructor(){super(...arguments),this.items=[]}_build(){return(this.items??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon??"mdi:gesture-tap-button",active:!1,disabled:!e||"unavailable"===e.state}})}_onSelect(t){Xt(this,this.hass,t.detail.value)}render(){const t=this._build();return t.length?F`<mt-selector-row
      .items=${t}
      display="icons"
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:W}};t([mt({attribute:!1})],Yt.prototype,"hass",void 0),t([mt({attribute:!1})],Yt.prototype,"items",void 0),t([mt()],Yt.prototype,"label",void 0),Yt=t([ht("mt-button-list")],Yt);const Gt={sensor:"mdi:gauge",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb",fan:"mdi:fan",button:"mdi:gesture-tap-button",input_button:"mdi:gesture-tap-button",scene:"mdi:palette",script:"mdi:script-text"};let Jt=class extends ct{constructor(){super(...arguments),this._tap=()=>{this.config.entity&&function(t,e,i,s){const a=s??{action:"default"};switch(a.action){case"none":return;case"more-info":return void yt(t,"hass-more-info",{entityId:a.entity??i});case"toggle":return void e.callService("homeassistant","toggle",{entity_id:i});case"url":return void(a.url_path&&window.open(a.url_path));case"navigate":return void(a.navigation_path&&(window.history.pushState(null,"",a.navigation_path),yt(t,"location-changed",{replace:!1})));case"call-service":case"perform-action":{const t=a.perform_action??a.service;if(!t||!t.includes("."))return;const[i,s]=t.split(".");return void e.callService(i,s,a.data??a.service_data??{},a.target)}default:Xt(t,e,i)}}(this,this.hass,this.config.entity,this.config.tap_action)}}get _stateObj(){return this.hass?.states?.[this.config.entity]}get _isOn(){return"on"===this._stateObj?.state}_secondary(){const t=this._stateObj;if(!t)return;const e=this.config.entity.split(".")[0];if("sensor"===e){const e=t.attributes.unit_of_measurement;return e?`${t.state} ${e}`:t.state}return["switch","light","fan","input_boolean","binary_sensor"].includes(e)?this._isOn?"On":"Off":["button","input_button","scene","script"].includes(e)?void 0:t.state}render(){if(!this.config?.entity)return W;const t=this._stateObj,e=this.config.entity.split(".")[0],i=this.config.name??t?.attributes.friendly_name??this.config.entity,s=this.config.icon??t?.attributes.icon??Gt[e]??"mdi:eye",a=this._secondary(),o=this.config.width,r=1===o,n=this.config.compact||"number"==typeof o&&o<=2;return r?F`
        <button
          class="tile icon-only ${this._isOn?"on":""}"
          @click=${this._tap}
          aria-label=${i}
          title=${i}
        >
          <ha-icon icon=${s}></ha-icon>
        </button>
      `:n?F`
        <button class="tile compact" @click=${this._tap} aria-label=${i} title=${i}>
          <div class="ic ${this._isOn?"on":""}"><ha-icon icon=${s}></ha-icon></div>
          ${a?F`<div class="val">${a}</div>`:W}
        </button>
      `:F`
      <button class="tile" @click=${this._tap} aria-label=${i}>
        <div class="ic ${this._isOn?"on":""}"><ha-icon icon=${s}></ha-icon></div>
        <div class="text">
          <div class="title">${i}</div>
          ${a?F`<div class="sub">${a}</div>`:W}
        </div>
      </button>
    `}};Jt.styles=[St,r`
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
      /* Icon-only (width 1): a single centered icon, like a mode chip. */
      .tile.icon-only {
        justify-content: center;
        align-items: center;
        gap: 0;
        padding: 0;
        min-height: 48px;
        height: 100%;
        border-radius: var(--mt-shape-full);
        color: var(--mt-on-surface-variant);
      }
      .tile.icon-only ha-icon {
        --mdc-icon-size: 24px;
      }
      .tile.icon-only.on {
        background: var(--mt-selected-bg);
        color: var(--mt-selected-fg);
      }
      /* Compact: icon over value, no title — fits many per row. */
      .tile.compact {
        flex-direction: column;
        gap: 4px;
        padding: 10px 6px;
        min-height: 0;
        text-align: center;
      }
      .tile.compact .ic {
        width: 36px;
        height: 36px;
      }
      .tile.compact .val {
        font-size: var(--md-sys-typescale-label-large-size, 13px);
        color: var(--mt-on-surface);
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
    `],t([mt({attribute:!1})],Jt.prototype,"hass",void 0),t([mt({attribute:!1})],Jt.prototype,"config",void 0),Jt=t([ht("mt-entity-tile")],Jt);let Qt=class extends ct{constructor(){super(...arguments),this.span=10}willUpdate(t){t.has("span")&&(this.style.gridColumn=`span ${Math.max(1,this.span)}`)}render(){const t=this.feature;switch(t.type){case"climate-hvac-modes":case"climate-fan-modes":case"climate-swing-modes":{const e="climate-hvac-modes"===t.type?"hvac":"climate-fan-modes"===t.type?"fan":"swing";return F`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind=${e}
          display=${t.display??"icons"}
          .options=${t.options}
          .order=${t.order}
        ></mt-climate-selector>`}case"input-select":return F`<mt-input-select
          .hass=${this.hass}
          entity=${t.entity}
          display=${t.display??"icons"}
          .label=${t.label}
          .options=${t.options}
          .order=${t.order}
        ></mt-input-select>`;case"switch-group":return F`<mt-switch-group
          .hass=${this.hass}
          .entities=${t.entities}
          display=${t.display??"icons"}
          .label=${t.label}
        ></mt-switch-group>`;case"switch-list":return F`<mt-switch-list
          .hass=${this.hass}
          .entities=${t.entities}
          .label=${t.label}
        ></mt-switch-list>`;case"button-list":return F`<mt-button-list
          .hass=${this.hass}
          .items=${t.items}
          .label=${t.label}
        ></mt-button-list>`;case"entity-tile":return F`<mt-entity-tile .hass=${this.hass} .config=${t}></mt-entity-tile>`;default:return W}}};Qt.styles=r`
    :host {
      display: block;
      /* allow shrinking below content so a wide icon list wraps/scrolls inside
         its column instead of overflowing the card */
      min-width: 0;
    }
  `,t([mt({attribute:!1})],Qt.prototype,"hass",void 0),t([mt()],Qt.prototype,"entityId",void 0),t([mt({attribute:!1})],Qt.prototype,"feature",void 0),t([mt({type:Number})],Qt.prototype,"span",void 0),Qt=t([ht("mt-feature-row")],Qt),function(){const t=window;t.customIcons=t.customIcons||{},t.customIcons.mt||(t.customIcons.mt={getIcon:async t=>{const e=Pt[t];if(!e)throw new Error(`Unknown mt icon: mt:${t}`);return e.secondary?{path:e.path,secondaryPath:e.secondary}:{path:e.path}},getIconList:async()=>Object.keys(Pt).map(t=>({name:t,keywords:["ac","swing","vane","louver","climate","airflow",...t.split("-")]}))})}(),console.info("%c MATERIAL-THERMOSTAT-CARD %c v0.8.9 ","color: white; background: #6750a4; font-weight: 700;","color: #6750a4; background: white; font-weight: 700;"),window.customCards=window.customCards||[],window.customCards.push({type:kt,name:"Material Thermostat Card",description:"A Material 3 Expressive thermostat card with customizable selectors and Nest/Google Home inspired UI.",preview:!0,documentationURL:"https://github.com/lageorgem/ha-material-thermostat-card",getEntitySuggestion:(t,e)=>"climate"===e.split(".")[0]?{config:{type:`custom:${kt}`,entity:e}}:null});let te=class extends ct{constructor(){super(...arguments),this._widthPx=0}static async getConfigElement(){return await Promise.resolve().then(function(){return ge}),document.createElement(Mt)}static getStubConfig(t){const e=Object.keys(t.states).find(t=>t.startsWith("climate."))??"";return{type:`custom:${kt}`,entity:e,features:[{type:"climate-hvac-modes"}]}}setConfig(t){if(!t.entity||"climate"!==t.entity.split(".")[0])throw new Error("You must specify a climate entity.");this._config=t}getCardSize(){return 7+(this._config?.features?.length??0)}get _stateObj(){return this.hass?.states?.[this._config?.entity]}_trackedEntityIds(){const t=new Set([this._config.entity]);for(const e of this._config.features??[])"entity"in e&&e.entity&&t.add(e.entity),"entities"in e&&e.entities?.forEach(e=>t.add(e.entity)),"items"in e&&e.items?.forEach(e=>t.add(e.entity));return[...t]}shouldUpdate(t){if(t.has("_config")||t.has("_selectedTemp")||t.has("_selectedLow")||t.has("_selectedHigh")||t.has("_widthPx"))return!0;if(!this._config)return!1;if(t.has("hass")){const e=t.get("hass");return!e||this._trackedEntityIds().some(t=>e.states[t]!==this.hass.states[t])}return!1}updated(t){if(t.has("hass")||t.has("_config")){const e=t.get("hass");!this._config?.theme||e&&e.themes===this.hass.themes&&!t.has("_config")||function(t,e,i,s){void 0===s&&(s=!1),t._themes||(t._themes={});var a=e.default_theme;("default"===i||i&&e.themes[i])&&(a=i);var o=bt({},t._themes);if("default"!==a){var r=e.themes[a];Object.keys(r).forEach(function(e){var i="--"+e;t._themes[i]="",o[i]=r[e]})}if(t.updateStyles?t.updateStyles(o):window.ShadyCSS&&window.ShadyCSS.styleSubtree(t,o),s){var n=document.querySelector("meta[name=theme-color]");if(n){n.hasAttribute("default-content")||n.setAttribute("default-content",n.getAttribute("content"));var l=o["--primary-color"]||n.getAttribute("default-content");n.setAttribute("content",l)}}}(this,this.hass.themes,this._config.theme)}if(t.has("hass")){const t=this._stateObj?.attributes;null!=this._selectedTemp&&t?.temperature===this._selectedTemp&&(this._selectedTemp=void 0),null!=this._selectedLow&&t?.target_temp_low===this._selectedLow&&(this._selectedLow=void 0),null!=this._selectedHigh&&t?.target_temp_high===this._selectedHigh&&(this._selectedHigh=void 0)}}_observeWidth(){this._resizeObserver||"undefined"==typeof ResizeObserver||(this._resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect.width??0,i=Math.max(0,e-32);Math.abs(i-this._widthPx)>=1&&(this._widthPx=i)}),this._resizeObserver.observe(this))}connectedCallback(){super.connectedCallback(),this._observeWidth()}_featureWidthPct(t){return"width"in t&&"number"==typeof t.width&&t.width>0?Math.max(10,Math.min(Ct,10*Math.round(t.width/10))):"entity-tile"===t.type?50:Ct}_featureSpan(t){return e=this._featureWidthPct(t),Math.max(1,Math.min(10,Math.round(e/10)));var e}_layout(){const t=this._config.features??[],e=this._widthPx,i=t.length?Math.max(...t.map(t=>this._featureWidthPct(t))):100,s=e*(100-i)/100;if(!(t.length>0&&i<100&&e>=560&&s>=240)){const t=Math.min(e,320);return{wide:!1,dialStyle:{marginBottom:`-${Math.round(.147*t)}px`},featureStyle:{},gridCols:10}}return{wide:!0,dialStyle:{flex:"1 1 auto"},featureStyle:{flex:`0 0 ${i}%`},gridCols:Math.max(1,i/10)}}get _isDual(){const t=this._stateObj?.attributes;return"heat_cool"===this._stateObj?.state&&null!=t?.target_temp_low&&null!=t?.target_temp_high}get _targetTemp(){return this._selectedTemp??this._stateObj?.attributes.temperature}get _targetLow(){return this._selectedLow??this._stateObj?.attributes.target_temp_low}get _targetHigh(){return this._selectedHigh??this._stateObj?.attributes.target_temp_high}_scheduleCommit(){this._debounceTimer&&window.clearTimeout(this._debounceTimer),this._debounceTimer=window.setTimeout(()=>{const t={entity_id:this._config.entity};this._isDual?(t.target_temp_low=this._targetLow,t.target_temp_high=this._targetHigh):t.temperature=this._targetTemp,this.hass.callService("climate","set_temperature",t)},600)}_onChanging(t){const{value:e,low:i,high:s}=t.detail;null!=i||null!=s?(this._selectedLow=i,this._selectedHigh=s):this._selectedTemp=e}_onChanged(t){this._onChanging(t),this._scheduleCommit()}_showMoreInfo(){yt(this,"hass-more-info",{entityId:this._config.entity})}_colorMode(){const t=this._stateObj?.attributes;switch(t?.hvac_action){case"cooling":return"cool";case"heating":return"heat";case"drying":return"dry";case"fan":return"fan_only";default:return this._stateObj?.state??"off"}}render(){if(!this._config||!this.hass)return F``;const t=this._stateObj;if(!t)return F`<ha-card
        ><div class="error">Entity not found: ${this._config.entity}</div></ha-card
      >`;const e=t.attributes,i=this._config.name??e.friendly_name??this._config.entity,s="unavailable"===t.state||"unknown"===t.state,a=this.hass.config?.unit_system?.temperature??"°C",o=this._colorMode(),r=this._layout();return F`
      <ha-card style=${`--mt-active-color: ${Ot(o)}`}>
        <div class="header">
          <div class="name" title=${i}>${i}</div>
          <button class="more" aria-label="More information" @click=${this._showMoreInfo}>
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </button>
        </div>

        <div class=${"body "+(r.wide?"wide":"stacked")}>
          <div class="dial-wrap" style=${Lt(r.dialStyle)}>
            <mt-circular-dial
              .value=${this._targetTemp??e.min_temp??20}
              .min=${e.min_temp??7}
              .max=${e.max_temp??35}
              .step=${e.target_temp_step??.5}
              .current=${e.current_temperature}
              .mode=${o}
              .modeLabel=${s?"Unavailable":zt(t.state)}
              .unit=${a}
              .dual=${this._isDual}
              .lowValue=${this._targetLow}
              .highValue=${this._targetHigh}
              .showCurrentAsPrimary=${this._config.show_current_as_primary??!1}
              .disabled=${s}
              @value-changing=${this._onChanging}
              @value-changed=${this._onChanged}
            ></mt-circular-dial>
          </div>

          ${this._config.features?.length?F`<div
                class="features"
                style=${Lt({...r.featureStyle,gridTemplateColumns:`repeat(${r.gridCols}, minmax(0, 1fr))`})}
              >
                ${this._config.features.map(t=>F`<mt-feature-row
                    .hass=${this.hass}
                    .entityId=${this._config.entity}
                    .feature=${t}
                    .span=${this._featureSpan(t)}
                  ></mt-feature-row>`)}
              </div>`:W}
        </div>
      </ha-card>
    `}disconnectedCallback(){super.disconnectedCallback(),this._debounceTimer&&window.clearTimeout(this._debounceTimer),this._resizeObserver?.disconnect(),this._resizeObserver=void 0}};te.styles=[St,r`
      :host {
        display: block;
      }
      ha-card {
        /* bottom padding equals the inter-control gap (see .body.stacked) */
        padding: 12px 16px 12px;
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
      .body {
        display: flex;
        margin-top: 8px;
      }
      /* Stacked (narrow): controls above a full-width feature area. The gap here
         (dial → first control row) matches the inter-row gap and bottom padding
         so the spacing below the dial is even. */
      .body.stacked {
        flex-direction: column;
        gap: 12px;
      }
      /* Side-by-side (wide): the feature area takes the widest feature's % on the
         right; the dial-wrap fills the rest and centers the fixed-size dial. */
      .body.wide {
        flex-direction: row;
        align-items: center;
        gap: 16px;
      }
      .dial-wrap {
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        min-width: 0;
      }
      /* Feature area: a 10-column grid (each column = 10% of the row). A feature
         spans width/10 columns; the grid's auto-flow packs them and wraps a row
         when the next feature's span doesn't fit. */
      .features {
        box-sizing: border-box;
        display: grid;
        align-content: flex-start;
        gap: 12px;
        min-width: 0;
      }
      .error {
        padding: 24px;
        text-align: center;
        color: var(--mt-error);
      }
    `],t([mt({attribute:!1})],te.prototype,"hass",void 0),t([vt()],te.prototype,"_config",void 0),t([vt()],te.prototype,"_selectedTemp",void 0),t([vt()],te.prototype,"_selectedLow",void 0),t([vt()],te.prototype,"_selectedHigh",void 0),t([vt()],te.prototype,"_widthPx",void 0),te=t([ht(kt)],te);let ee=class extends ct{constructor(){super(...arguments),this.value="icons"}_set(t){t!==this.value&&this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t},bubbles:!0,composed:!0}))}render(){return F`
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
    `}};ee.styles=r`
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
  `,t([mt()],ee.prototype,"value",void 0),ee=t([ht("mt-display-toggle")],ee);const ie=new Set(["ArrowRight","ArrowUp","ArrowLeft","ArrowDown","PageUp","PageDown","Home","End"]);let se=class extends ct{constructor(){super(...arguments),this.disabled=!1,this.step=1,this.min=1,this.max=4,this.tooltipMode="interaction",this._pressed=!1,this._tooltipVisible=!1,this._onPointerDown=t=>{this.disabled||(t.preventDefault(),this._slider.setPointerCapture(t.pointerId),this._pressed=!0,this._tooltipVisible=!0,this.value=this._range*this._pctFromX(t.clientX))},this._onPointerMove=t=>{this._pressed&&!this.disabled&&(this.value=this._range*this._pctFromX(t.clientX),this._emit("slider-moved",this._stepped(this._bounded(this.value))))},this._onPointerUp=t=>{this._pressed&&(this._slider.releasePointerCapture(t.pointerId),this._pressed=!1,this._tooltipVisible=!1,this.value=this._stepped(this._bounded(this._range*this._pctFromX(t.clientX))),this._emit("value-changed",this.value))},this._onKeyDown=t=>{if(this.disabled||!ie.has(t.key))return;t.preventDefault();const e=this.value??this.min;switch(t.key){case"ArrowRight":case"ArrowUp":this.value=this._bounded(e+this.step);break;case"ArrowLeft":case"ArrowDown":this.value=this._bounded(e-this.step);break;case"PageUp":this.value=this._stepped(this._bounded(e+this._bigStep));break;case"PageDown":this.value=this._stepped(this._bounded(e-this._bigStep));break;case"Home":this.value=this.min;break;case"End":this.value=this.max}this._emit("value-changed",this.value)}}get _range(){return this.range??this.max}_bounded(t){return Math.min(Math.max(t,this.min),this.max)}_stepped(t){return Math.round(t/this.step)*this.step}_valueToPct(t){return this._bounded(t)/this._range}_pctFromX(t){const e=this._slider.getBoundingClientRect();return Math.max(0,Math.min(1,(t-e.left)/e.width))}updated(t){if(t.has("value")){const t=this._stepped(this.value??0).toString();this.setAttribute("aria-valuenow",t),this.setAttribute("aria-valuetext",t)}t.has("min")&&this.setAttribute("aria-valuemin",this.min.toString()),t.has("max")&&this.setAttribute("aria-valuemax",this.max.toString())}connectedCallback(){super.connectedCallback(),this.setAttribute("role","slider"),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"),this.setAttribute("aria-orientation","horizontal"),this.addEventListener("keydown",this._onKeyDown)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("keydown",this._onKeyDown)}get _bigStep(){return Math.max(this.step,(this.max-this.min)/10)}_emit(t,e){this.dispatchEvent(new CustomEvent(t,{detail:{value:e},bubbles:!0,composed:!0}))}_renderTooltip(){if("never"===this.tooltipMode)return W;const t="always"===this.tooltipMode||this._tooltipVisible&&"interaction"===this.tooltipMode,e=this._bounded(this._stepped(this.value??0));return F`<span aria-hidden="true" class=${It({tooltip:!0,visible:t})}
      >${e}</span
    >`}render(){const t=Math.round(this._range/this.step);return F`
      <div class=${It({container:!0,pressed:this._pressed})}
        style=${Lt({"--value":`${this._valueToPct(this.value??0)}`})}>
        <div
          id="slider"
          class="slider"
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
        >
          <div class="track">
            <div class="background"></div>
            <div
              class="active"
              style=${Lt({"--min":""+this.min/this._range,"--max":""+(1-this.max/this._range)})}
            ></div>
          </div>
          ${Array(t).fill(0).map((e,i)=>0===i?W:F`<div class="dot" style=${Lt({"--value":""+i/t})}></div>`)}
          ${void 0!==this.value?F`<div class="handle"></div>`:W}
          ${this._renderTooltip()}
        </div>
      </div>
    `}};se.styles=r`
    :host {
      display: block;
      height: 36px;
      width: 100%;
      outline: none;
      transition: box-shadow 180ms ease-in-out;
    }
    :host(:focus-visible) {
      box-shadow: 0 0 0 2px var(--primary-color);
    }
    .container {
      position: relative;
      height: 100%;
      width: 100%;
    }
    .slider {
      position: relative;
      height: 100%;
      width: 100%;
      transform: translateZ(0);
      overflow: visible;
      cursor: pointer;
      touch-action: pan-y;
    }
    .slider * {
      pointer-events: none;
      user-select: none;
    }
    .track {
      position: absolute;
      inset: 0;
      margin: auto;
      height: 16px;
      width: 100%;
      border-radius: var(--ha-border-radius-md, 8px);
      overflow: hidden;
    }
    .background {
      position: absolute;
      inset: 0;
      background: var(--disabled-color, #bdbdbd);
      opacity: 0.4;
    }
    .active {
      position: absolute;
      background: var(--primary-color, #6750a4);
      top: 0;
      right: calc(var(--max) * 100%);
      bottom: 0;
      left: calc(var(--min) * 100%);
    }
    .handle {
      position: absolute;
      top: 0;
      height: 100%;
      width: 16px;
      transform: translate(-50%, 0);
      background: var(--card-background-color, #1c1b22);
      left: calc(var(--value, 0) * 100%);
      transition: left 180ms ease-in-out;
    }
    .handle::after {
      position: absolute;
      inset: 0;
      width: 4px;
      border-radius: 2px;
      height: 100%;
      margin: auto;
      background: var(--primary-color, #6750a4);
      content: '';
    }
    .dot {
      position: absolute;
      top: 0;
      bottom: 0;
      opacity: 0.6;
      margin: auto;
      width: 4px;
      height: 4px;
      flex-shrink: 0;
      transform: translate(-50%, 0);
      background: var(--card-background-color, #1c1b22);
      left: calc(var(--value, 0) * 100%);
      border-radius: 2px;
    }
    :host([disabled]) .slider {
      cursor: not-allowed;
    }
    :host([disabled]) .track {
      opacity: 0.5;
    }
    :host([disabled]) .handle::after,
    :host([disabled]) .active {
      background: var(--disabled-color, #bdbdbd);
    }
    .tooltip {
      position: absolute;
      top: 0;
      left: calc(min(max(var(--value) * 100%, 0%), 100%));
      transform: translate3d(-50%, calc(-100% - 4px), 0);
      background-color: var(--clear-background-color, var(--card-background-color, #2b2933));
      color: var(--primary-text-color, #e6e1e9);
      font-size: var(--control-slider-tooltip-font-size, 14px);
      border-radius: var(--ha-border-radius-lg, 12px);
      padding: 0.2em 0.4em;
      opacity: 0;
      white-space: nowrap;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      pointer-events: none;
      transition:
        opacity 180ms ease-in-out,
        left 180ms ease-in-out;
    }
    .tooltip.visible {
      opacity: 1;
    }
    .pressed .handle {
      transition: none;
    }
  `,t([mt({type:Boolean,reflect:!0})],se.prototype,"disabled",void 0),t([mt({type:Number})],se.prototype,"value",void 0),t([mt({type:Number})],se.prototype,"step",void 0),t([mt({type:Number})],se.prototype,"min",void 0),t([mt({type:Number})],se.prototype,"max",void 0),t([mt({type:Number})],se.prototype,"range",void 0),t([mt({attribute:"tooltip-mode"})],se.prototype,"tooltipMode",void 0),t([vt()],se.prototype,"_pressed",void 0),t([vt()],se.prototype,"_tooltipVisible",void 0),t([ft("#slider")],se.prototype,"_slider",void 0),se=t([ht("mt-grid-slider")],se);let ae=class extends ct{constructor(){super(...arguments),this.default=Ct}_emit(t){this.dispatchEvent(new CustomEvent("width-changed",{detail:{value:t},bubbles:!0,composed:!0}))}_onChanged(t){const e=t.detail?.value;this._emit("number"==typeof e?e:void 0)}_reset(){null!=this.value&&this._emit(void 0)}render(){const t=null!=this.value,e=this.value??this.default;return F`
      <div class="label">Width (% of card)</div>
      <div class="control">
        <button
          class="reset"
          aria-label="Reset width to full"
          title="Reset to full width"
          ?disabled=${!t}
          @click=${this._reset}
        >
          <ha-icon icon="mdi:restore"></ha-icon>
        </button>
        <mt-grid-slider
          .value=${e}
          .min=${10}
          .max=${Ct}
          .step=${10}
          tooltip-mode="always"
          @value-changed=${this._onChanged}
        ></mt-grid-slider>
      </div>
      ${t?W:F`<div class="hint">
            Default — ${this.default===Ct?"full width":`${this.default}%`}.
          </div>`}
    `}};ae.styles=r`
    :host {
      display: block;
    }
    .label {
      color: var(--secondary-text-color);
      font-size: 0.85rem;
      margin-bottom: 4px;
    }
    .control {
      display: flex;
      align-items: center;
      gap: 8px;
      /* room above the slider for the floating value tooltip */
      padding-top: 20px;
    }
    .reset {
      flex: 0 0 auto;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      display: grid;
      place-items: center;
      -webkit-tap-highlight-color: transparent;
    }
    .reset:hover:not([disabled]) {
      background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
    }
    .reset[disabled] {
      opacity: 0.38;
      cursor: default;
    }
    .reset ha-icon {
      --mdc-icon-size: 20px;
    }
    mt-grid-slider {
      flex: 1 1 auto;
      min-width: 0;
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 0.78rem;
      margin-top: 4px;
    }
  `,t([mt({attribute:!1})],ae.prototype,"hass",void 0),t([mt({type:Number})],ae.prototype,"value",void 0),t([mt({type:Number})],ae.prototype,"default",void 0),ae=t([ht("mt-width-field")],ae);let oe=class extends ct{_values(){const t=this.hass?.states?.[this.entityId]?.attributes;return t?"hvac"===this.kind?t.hvac_modes??[]:"fan"===this.kind?t.fan_modes??[]:t.swing_modes??[]:[]}_orderedValues(){return Zt(this._values(),this.feature.order)}_moveOption(t){const{oldIndex:e,newIndex:i}=t.detail,s=this._orderedValues(),[a]=s.splice(e,1);s.splice(i,0,a),this._emit({order:s})}_override(t){return this.feature.options?.find(e=>e.value===t)}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setOverride(t,e){const i=[...this.feature.options??[]],s=i.findIndex(e=>e.value===t),a={...s>=0?i[s]:{value:t},...e};""===a.label&&delete a.label,""===a.icon&&delete a.icon,a.hide||delete a.hide;const o=void 0!==a.label||void 0!==a.icon||!!a.hide;s>=0?o?i[s]=a:i.splice(s,1):o&&i.push(a),this._emit({options:i})}render(){const t=this._values(),e=this.feature.display??"icons";return F`
      <div class="editor">
        <div class="field">
          <span class="field-label">Display</span>
          <mt-display-toggle
            .value=${e}
            @value-changed=${t=>this._emit({display:t.detail.value})}
          ></mt-display-toggle>
        </div>

        <mt-width-field
          .hass=${this.hass}
          .value=${this.feature.width}
          @width-changed=${t=>this._emit({width:t.detail.value})}
        ></mt-width-field>

        ${0===t.length?F`<p class="hint">
              Pick a climate entity that exposes ${this.kind} options to customize them.
            </p>`:F`<ha-sortable handle-selector=".handle" @item-moved=${this._moveOption}>
              <div class="options">
                ${this._orderedValues().map(t=>this._renderOption(t))}
              </div>
            </ha-sortable>`}
      </div>
    `}_renderOption(t){const e=this._override(t),i=!!e?.hide;return F`
      <div class="opt">
        <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
        <div class="opt-name" title=${t}>${zt(t)}</div>
        <ha-textfield
          class="opt-label"
          label="Label"
          .value=${e?.label??""}
          .placeholder=${zt(t)}
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
    `}};oe.styles=r`
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
      grid-template-columns: auto minmax(60px, 1fr) 2fr auto auto;
      align-items: center;
      gap: 8px;
    }
    .handle {
      cursor: grab;
      color: var(--secondary-text-color);
      display: grid;
      place-items: center;
    }
    .handle ha-icon {
      --mdc-icon-size: 20px;
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
  `,t([mt({attribute:!1})],oe.prototype,"hass",void 0),t([mt()],oe.prototype,"entityId",void 0),t([mt()],oe.prototype,"kind",void 0),t([mt({attribute:!1})],oe.prototype,"feature",void 0),oe=t([ht("mt-climate-feature-editor")],oe);let re=class extends ct{_values(){return this.hass?.states?.[this.feature.entity]?.attributes?.options??[]}_orderedValues(){return Zt(this._values(),this.feature.order)}_moveOption(t){const{oldIndex:e,newIndex:i}=t.detail,s=this._orderedValues(),[a]=s.splice(e,1);s.splice(i,0,a),this._emit({order:s})}_override(t){return this.feature.options?.find(e=>e.value===t)}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setOverride(t,e){const i=[...this.feature.options??[]],s=i.findIndex(e=>e.value===t),a={...s>=0?i[s]:{value:t},...e};""===a.label&&delete a.label,""===a.icon&&delete a.icon,a.hide||delete a.hide;const o=void 0!==a.label||void 0!==a.icon||!!a.hide;s>=0?o?i[s]=a:i.splice(s,1):o&&i.push(a),this._emit({options:i})}render(){const t=this._values(),e=this.feature.display??"icons";return F`
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

        <mt-width-field
          .hass=${this.hass}
          .value=${this.feature.width}
          @width-changed=${t=>this._emit({width:t.detail.value})}
        ></mt-width-field>

        ${0===t.length?F`<p class="hint">Pick an input_select entity to customize its options.</p>`:F`<ha-sortable handle-selector=".handle" @item-moved=${this._moveOption}>
              <div class="options">
              ${this._orderedValues().map(t=>{const e=this._override(t),i=!!e?.hide;return F`<div class="opt">
                  <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
                  <div class="opt-name" title=${t}>${zt(t)}</div>
                  <ha-textfield
                    label="Label"
                    .value=${e?.label??""}
                    .placeholder=${zt(t)}
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
              </div>
            </ha-sortable>`}
      </div>
    `}};re.styles=r`
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
      grid-template-columns: auto minmax(60px, 1fr) 2fr auto auto;
      align-items: center;
      gap: 8px;
    }
    .handle {
      cursor: grab;
      color: var(--secondary-text-color);
      display: grid;
      place-items: center;
    }
    .handle ha-icon {
      --mdc-icon-size: 20px;
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
  `,t([mt({attribute:!1})],re.prototype,"hass",void 0),t([mt({attribute:!1})],re.prototype,"feature",void 0),re=t([ht("mt-input-select-editor")],re);let ne=class extends ct{constructor(){super(...arguments),this.itemsKey="entities",this.showDisplay=!1}get _items(){return this.feature[this.itemsKey]??[]}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setItems(t){this._emit({[this.itemsKey]:t})}_updateItem(t,e){const i=[...this._items],s={...i[t],...e};""===s.label&&delete s.label,""===s.icon&&delete s.icon,i[t]=s,this._setItems(i)}_addItem(){this._setItems([...this._items,{entity:""}])}_moveItem(t){const{oldIndex:e,newIndex:i}=t.detail,s=[...this._items],[a]=s.splice(e,1);s.splice(i,0,a),this._setItems(s)}_removeItem(t){const e=[...this._items];e.splice(t,1),this._setItems(e)}render(){const t=this.feature.display??"icons";return F`
      <div class="editor">
        <ha-textfield
          label="Row label (optional)"
          .value=${this.feature.label??""}
          @input=${t=>this._emit({label:t.target.value||void 0})}
        ></ha-textfield>

        ${this.showDisplay?F`<div class="field">
              <span class="field-label">Display</span>
              <mt-display-toggle
                .value=${t}
                @value-changed=${t=>this._emit({display:t.detail.value})}
              ></mt-display-toggle>
            </div>`:W}

        <mt-width-field
          .hass=${this.hass}
          .value=${this.feature.width}
          @width-changed=${t=>this._emit({width:t.detail.value})}
        ></mt-width-field>

        <ha-sortable handle-selector=".handle" @item-moved=${this._moveItem}>
          <div class="items">
            ${this._items.map((t,e)=>F`<div class="item">
              <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
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
        </ha-sortable>

        <ha-button @click=${this._addItem}>
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          Add entity
        </ha-button>
      </div>
    `}};ne.styles=r`
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
      grid-template-columns: auto 2fr 1.4fr auto auto;
      align-items: center;
      gap: 8px;
    }
    .handle {
      cursor: grab;
      color: var(--secondary-text-color);
      display: grid;
      place-items: center;
    }
    .handle ha-icon {
      --mdc-icon-size: 20px;
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
  `,t([mt({attribute:!1})],ne.prototype,"hass",void 0),t([mt({attribute:!1})],ne.prototype,"feature",void 0),t([mt()],ne.prototype,"itemsKey",void 0),t([mt({type:Boolean})],ne.prototype,"showDisplay",void 0),t([mt({attribute:!1})],ne.prototype,"includeDomains",void 0),ne=t([ht("mt-entity-list-editor")],ne);const le=[{name:"entity",selector:{entity:{}}},{name:"name",selector:{text:{}}},{name:"icon",selector:{icon:{}}},{name:"compact",selector:{boolean:{}}},{name:"tap_action",selector:{ui_action:{}}}];let ce,de=class extends ct{constructor(){super(...arguments),this._computeLabel=t=>{switch(t.name){case"entity":return"Entity";case"name":return"Name (optional)";case"icon":return"Icon (optional)";case"compact":return"Compact (icon + value only)";case"tap_action":return"Tap action";default:return t.name}}}get _data(){return{entity:this.feature.entity,name:this.feature.name,icon:this.feature.icon,compact:this.feature.compact??!1,tap_action:this.feature.tap_action}}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_changed(t){const e=t.detail.value;this._emit({entity:e.entity,name:e.name||void 0,icon:e.icon||void 0,compact:e.compact||void 0,tap_action:e.tap_action||void 0})}render(){return F`
      <ha-form
        .hass=${this.hass}
        .data=${this._data}
        .schema=${le}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._changed}
      ></ha-form>
      <mt-width-field
        .hass=${this.hass}
        .value=${this.feature.width}
        .default=${50}
        @width-changed=${t=>this._emit({width:t.detail.value})}
      ></mt-width-field>
    `}};de.styles=r`
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `,t([mt({attribute:!1})],de.prototype,"hass",void 0),t([mt({attribute:!1})],de.prototype,"feature",void 0),de=t([ht("mt-entity-tile-editor")],de);const he=[{name:"entity",selector:{entity:{domain:"climate"}}},{name:"name",selector:{text:{}}},{name:"theme",selector:{theme:{}}},{name:"show_current_as_primary",selector:{boolean:{}}}],pe=[{type:"climate-hvac-modes",label:"Climate HVAC modes"},{type:"climate-fan-modes",label:"Climate fan modes"},{type:"climate-swing-modes",label:"Climate swing modes"},{type:"input-select",label:"Input select"},{type:"switch-group",label:"Switch group"},{type:"switch-list",label:"Switch list"},{type:"button-list",label:"Button list"},{type:"entity-tile",label:"Entity tile"}],ue={"climate-hvac-modes":"hvac_modes","climate-fan-modes":"fan_modes","climate-swing-modes":"swing_modes"};function me(t){switch(t){case"input-select":case"entity-tile":return{type:t,entity:""};case"switch-group":case"switch-list":return{type:t,entities:[]};case"button-list":return{type:t,items:[]};default:return{type:t}}}const ve={"climate-hvac-modes":"Climate HVAC modes","climate-fan-modes":"Climate fan modes","climate-swing-modes":"Climate swing modes","input-select":"Input select","switch-group":"Switch group","switch-list":"Switch list","button-list":"Button list","entity-tile":"Entity tile"};let fe=class extends ct{constructor(){super(...arguments),this._editingIndex=null,this._addOpen=!1,this._computeLabel=t=>{switch(t.name){case"entity":return"Climate entity (required)";case"name":return"Name";case"theme":return"Theme";case"show_current_as_primary":return"Show current temperature as primary information";default:return t.name}}}connectedCallback(){super.connectedCallback(),(ce||(ce=(async()=>{if(customElements.get("ha-form")&&customElements.get("ha-entity-picker")&&customElements.get("ha-icon-picker"))return;const t=window.loadCardHelpers;if(t)try{const e=await t(),i=await e.createCardElement({type:"entities",entities:[]}),s=i?.constructor;s?.getConfigElement&&await s.getConfigElement()}catch{}})(),ce)).then(()=>this.requestUpdate())}setConfig(t){this._config=t}get _baseData(){return{entity:this._config.entity,name:this._config.name,theme:this._config.theme,show_current_as_primary:this._config.show_current_as_primary??!1}}_emit(t){this._config=t,yt(this,"config-changed",{config:t})}_baseChanged(t){const e=t.detail.value,i={...this._config,entity:e.entity,name:e.name||void 0,theme:e.theme||void 0,show_current_as_primary:e.show_current_as_primary||void 0};this._emit(i)}get _features(){return this._config.features??[]}_addableFeatures(){const t=this.hass?.states?.[this._config.entity]?.attributes??{},e=new Set(this._features.map(t=>t.type));return pe.filter(({type:i})=>{const s=ue[i];return!s||!e.has(i)&&Array.isArray(t[s])&&t[s].length>0})}_setFeatures(t){this._emit({...this._config,features:t})}_pickFeature(t){this._addOpen=!1;const e=[...this._features,me(t)];this._editingIndex=e.length-1,this._setFeatures(e)}_removeFeature(t){const e=[...this._features];e.splice(t,1),this._editingIndex=null,this._setFeatures(e)}_moveFeature(t){const{oldIndex:e,newIndex:i}=t.detail,s=[...this._features],[a]=s.splice(e,1);s.splice(i,0,a),this._editingIndex=null,this._setFeatures(s)}_featureChanged(t,e){const i=[...this._features];i[t]=e.detail.feature,this._setFeatures(i)}render(){return this._config&&this.hass?F`
      <div class="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._baseData}
          .schema=${he}
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
          ${this._addOpen?F`<div class="add-menu">
                ${this._addableFeatures().map(t=>F`<button class="add-opt" @click=${()=>this._pickFeature(t.type)}>
                    ${t.label}
                  </button>`)}
              </div>`:W}
        </div>
      </div>
    `:F``}_renderFeatureRow(t,e){const i=this._editingIndex===e;return F`
      <div class="feature">
        <div class="feature-head">
          <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
          <div class="feature-title">${ve[t.type]??t.type}</div>
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
    `}_renderFeatureEditor(t,e){const i=t=>this._featureChanged(e,t);let s;switch(t.type){case"climate-hvac-modes":case"climate-fan-modes":case"climate-swing-modes":{const e="climate-hvac-modes"===t.type?"hvac":"climate-fan-modes"===t.type?"fan":"swing";s=F`<mt-climate-feature-editor
          .hass=${this.hass}
          .entityId=${this._config.entity}
          kind=${e}
          .feature=${t}
          @feature-changed=${i}
        ></mt-climate-feature-editor>`;break}case"input-select":s=F`<mt-input-select-editor
          .hass=${this.hass}
          .feature=${t}
          @feature-changed=${i}
        ></mt-input-select-editor>`;break;case"switch-group":s=F`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${t}
          itemsKey="entities"
          .showDisplay=${!0}
          .includeDomains=${["switch","input_boolean","light","fan"]}
          @feature-changed=${i}
        ></mt-entity-list-editor>`;break;case"switch-list":s=F`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${t}
          itemsKey="entities"
          .includeDomains=${["switch","input_boolean","light","fan"]}
          @feature-changed=${i}
        ></mt-entity-list-editor>`;break;case"button-list":s=F`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${t}
          itemsKey="items"
          .includeDomains=${["button","input_button","scene","script"]}
          @feature-changed=${i}
        ></mt-entity-list-editor>`;break;case"entity-tile":s=F`<mt-entity-tile-editor
          .hass=${this.hass}
          .feature=${t}
          @feature-changed=${i}
        ></mt-entity-tile-editor>`;break;default:s=F`<p class="hint">No editor available.</p>`}return F`<div class="feature-editor">${s}</div>`}};fe.styles=r`
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
  `,t([mt({attribute:!1})],fe.prototype,"hass",void 0),t([vt()],fe.prototype,"_config",void 0),t([vt()],fe.prototype,"_editingIndex",void 0),t([vt()],fe.prototype,"_addOpen",void 0),fe=t([ht(Mt)],fe);var ge=Object.freeze({__proto__:null,get MaterialThermostatCardEditor(){return fe}});export{te as MaterialThermostatCard};
