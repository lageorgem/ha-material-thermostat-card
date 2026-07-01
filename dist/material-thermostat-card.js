function t(t,e,i,s){var o,r=arguments.length,a=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,i,s);else for(var n=t.length-1;n>=0;n--)(o=t[n])&&(a=(r<3?o(a):r>3?o(e,i,a):o(e,i))||a);return r>3&&a&&Object.defineProperty(e,i,a),a}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o=new WeakMap;let r=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=o.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&o.set(e,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new r(i,t,s)},n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,f=m.trustedTypes,v=f?f.emptyScript:"",g=m.reactiveElementPolyfillSupport,_=(t,e)=>t,b={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!l(t,e),w={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=w){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:o}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);o?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??w}static _$Ei(){if(this.hasOwnProperty(_("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(_("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_("properties"))){const t=this.properties,e=[...h(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),o=e.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(e,i.type);this._$Em=t,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:b;this._$Em=s;const r=o.fromAttribute(e,t.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(t,e,i,s=!1,o){if(void 0!==t){const r=this.constructor;if(!1===s&&(o=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??y)(o,e)||i.useDefault&&i.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:o},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==o||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[_("elementProperties")]=new Map,x[_("finalized")]=new Map,g?.({ReactiveElement:x}),(m.reactiveElementVersions??=[]).push("2.1.2");const $=globalThis,A=t=>t,k=$.trustedTypes,L=k?k.createPolicy("lit-html",{createHTML:t=>t}):void 0,M="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,S="?"+C,E=`<${S}>`,O=document,z=()=>O.createComment(""),P=t=>null===t||"object"!=typeof t&&"function"!=typeof t,Z=Array.isArray,I="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,H=/>/g,R=RegExp(`>|${I}(?:([^\\s"'>=/]+)(${I}*=${I}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),N=/'/g,F=/"/g,j=/^(?:script|style|textarea|title)$/i,U=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),V=U(1),q=U(2),B=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),K=new WeakMap,X=O.createTreeWalker(O,129);function Y(t,e){if(!Z(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==L?L.createHTML(e):e}const G=(t,e)=>{const i=t.length-1,s=[];let o,r=2===e?"<svg>":3===e?"<math>":"",a=T;for(let e=0;e<i;e++){const i=t[e];let n,l,c=-1,d=0;for(;d<i.length&&(a.lastIndex=d,l=a.exec(i),null!==l);)d=a.lastIndex,a===T?"!--"===l[1]?a=D:void 0!==l[1]?a=H:void 0!==l[2]?(j.test(l[2])&&(o=RegExp("</"+l[2],"g")),a=R):void 0!==l[3]&&(a=R):a===R?">"===l[0]?(a=o??T,c=-1):void 0===l[1]?c=-2:(c=a.lastIndex-l[2].length,n=l[1],a=void 0===l[3]?R:'"'===l[3]?F:N):a===F||a===N?a=R:a===D||a===H?a=T:(a=R,o=void 0);const h=a===R&&t[e+1].startsWith("/>")?" ":"";r+=a===T?i+E:c>=0?(s.push(n),i.slice(0,c)+M+i.slice(c)+C+h):i+C+(-2===c?e:h)}return[Y(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class J{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let o=0,r=0;const a=t.length-1,n=this.parts,[l,c]=G(t,e);if(this.el=J.createElement(l,i),X.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=X.nextNode())&&n.length<a;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(M)){const e=c[r++],i=s.getAttribute(t).split(C),a=/([.?@])?(.*)/.exec(e);n.push({type:1,index:o,name:a[2],strings:i,ctor:"."===a[1]?st:"?"===a[1]?ot:"@"===a[1]?rt:it}),s.removeAttribute(t)}else t.startsWith(C)&&(n.push({type:6,index:o}),s.removeAttribute(t));if(j.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=k?k.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],z()),X.nextNode(),n.push({type:2,index:++o});s.append(t[e],z())}}}else if(8===s.nodeType)if(s.data===S)n.push({type:2,index:o});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)n.push({type:7,index:o}),t+=C.length-1}o++}}static createElement(t,e){const i=O.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,s){if(e===B)return e;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const r=P(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(e=Q(t,o._$AS(t,e.values),o,s)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??O).importNode(e,!0);X.currentNode=s;let o=X.nextNode(),r=0,a=0,n=i[0];for(;void 0!==n;){if(r===n.index){let e;2===n.type?e=new et(o,o.nextSibling,this,t):1===n.type?e=new n.ctor(o,n.name,n.strings,this,t):6===n.type&&(e=new at(o,this,t)),this._$AV.push(e),n=i[++a]}r!==n?.index&&(o=X.nextNode(),r++)}return X.currentNode=O,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),P(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==B&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>Z(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&P(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(Y(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new tt(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=K.get(t.strings);return void 0===e&&K.set(t.strings,e=new J(t)),e}k(t){Z(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const o of t)s===e.length?e.push(i=new et(this.O(z()),this.O(z()),this,this.options)):i=e[s],i._$AI(o),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class it{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,o){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(t,e=this,i,s){const o=this.strings;let r=!1;if(void 0===o)t=Q(this,t,e,0),r=!P(t)||t!==this._$AH&&t!==B,r&&(this._$AH=t);else{const s=t;let a,n;for(t=o[0],a=0;a<o.length-1;a++)n=Q(this,s[i+a],e,a),n===B&&(n=this._$AH[a]),r||=!P(n)||n!==this._$AH[a],n===W?t=W:t!==W&&(t+=(n??"")+o[a+1]),this._$AH[a]=n}r&&!s&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class ot extends it{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class rt extends it{constructor(t,e,i,s,o){super(t,e,i,s,o),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??W)===B)return;const i=this._$AH,s=t===W&&i!==W||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==W&&(i===W||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const nt=$.litHtmlPolyfillSupport;nt?.(J,et),($.litHtmlVersions??=[]).push("3.3.3");const lt=globalThis;let ct=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let o=s._$litPart$;if(void 0===o){const t=i?.renderBefore??null;s._$litPart$=o=new et(e.insertBefore(z(),t),t,void 0,i??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return B}};ct._$litElement$=!0,ct.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ct});const dt=lt.litElementPolyfillSupport;dt?.({LitElement:ct}),(lt.litElementVersions??=[]).push("4.2.2");const ht=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:y},ut=(t=pt,e,i)=>{const{kind:s,metadata:o}=i;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const o=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,o,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const o=this[s];e.call(this,i),this.requestUpdate(s,o,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function mt(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ft(t){return mt({...t,state:!0,attribute:!1})}function vt(t,e){return(e,i,s)=>((t,e,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof e&&Object.defineProperty(t,e,i),i))(e,i,{get(){return e=this,e.renderRoot?.querySelector(t)??null;var e}})}var gt,_t;function bt(){return(bt=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var s in i)Object.prototype.hasOwnProperty.call(i,s)&&(t[s]=i[s])}return t}).apply(this,arguments)}!function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(gt||(gt={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(_t||(_t={}));var yt=function(t,e,i,s){s=s||{},i=null==i?{}:i;var o=new Event(e,{bubbles:void 0===s.bubbles||s.bubbles,cancelable:Boolean(s.cancelable),composed:void 0===s.composed||s.composed});return o.detail=i,t.dispatchEvent(o),o};const wt=t=>(...e)=>({_$litDirective$:t,values:e});let xt=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};const $t="important",At=" !"+$t,kt=wt(class extends xt{constructor(t){if(super(t),1!==t.type||"style"!==t.name||t.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(t){return Object.keys(t).reduce((e,i)=>{const s=t[i];return null==s?e:e+`${i=i.includes("-")?i:i.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${s};`},"")}update(t,[e]){const{style:i}=t.element;if(void 0===this.ft)return this.ft=new Set(Object.keys(e)),this.render(e);for(const t of this.ft)null==e[t]&&(this.ft.delete(t),t.includes("-")?i.removeProperty(t):i[t]=null);for(const t in e){const s=e[t];if(null!=s){this.ft.add(t);const e="string"==typeof s&&s.endsWith(At);t.includes("-")||e?i.setProperty(t,e?s.slice(0,-11):s,e?$t:""):i[t]=s}}return B}}),Lt="material-thermostat-card",Mt="material-thermostat-card-editor",Ct=100,St=a`
  :host {
    --mt-primary: var(--md-sys-color-primary, var(--primary-color, #6750a4));
    --mt-on-primary: var(--md-sys-color-on-primary, #ffffff);
    --mt-primary-container: var(--md-sys-color-primary-container, rgba(103, 80, 164, 0.16));
    --mt-on-primary-container: var(--md-sys-color-on-primary-container, var(--primary-text-color, #21005d));

    --mt-surface: var(--md-sys-color-surface, var(--card-background-color, #fef7ff));
    /* Surface containers. Under material-you-theme the real M3 tokens are used.
       Everywhere else we tint the card background toward the on-surface color so
       tiles/lists read as a distinct, slightly elevated surface instead of
       blending into the card (the tint darkens in light themes and lightens in
       dark themes — the right direction for elevation in both). The steps mirror
       M3's container / high / highest elevation ladder. */
    --mt-surface-bg: var(--ha-card-background, var(--card-background-color, #f3edf7));
    --mt-surface-container: var(
      --md-sys-color-surface-container,
      color-mix(in srgb, var(--mt-on-surface) 8%, var(--mt-surface-bg))
    );
    --mt-surface-container-high: var(
      --md-sys-color-surface-container-high,
      color-mix(in srgb, var(--mt-on-surface) 11%, var(--mt-surface-bg))
    );
    --mt-surface-container-highest: var(
      --md-sys-color-surface-container-highest,
      color-mix(in srgb, var(--mt-on-surface) 14%, var(--mt-surface-bg))
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
`,Et={off:"mdi:power",heat:"mdi:fire",cool:"mdi:snowflake",heat_cool:"mdi:sun-snowflake-variant",auto:"mdi:thermostat-auto",dry:"mdi:water-percent",fan_only:"mdi:fan"};function Ot(t){switch(t){case"cool":return"var(--state-climate-cool-color, #2b9af9)";case"heat":return"var(--state-climate-heat-color, #ff8100)";case"heat_cool":return"var(--state-climate-heat_cool-color, #009688)";case"auto":return"var(--state-climate-auto-color, #e5c454)";case"dry":return"var(--state-climate-dry-color, #efbd07)";case"fan_only":return"var(--state-climate-fan_only-color, #8a8a8a)";default:return"var(--state-climate-off-color, var(--mt-on-surface-variant))"}}function zt(t){const e=t.toLowerCase();return e.includes("auto")?"mdi:fan-auto":e.includes("off")||"0"===e?"mdi:fan-off":/(^|[^0-9])1([^0-9]|$)|low|min|quiet|silent/.test(e)?"mdi:fan-speed-1":/(^|[^0-9])2([^0-9]|$)|mid|med/.test(e)?"mdi:fan-speed-2":/(^|[^0-9])3([^0-9]|$)|high|max|strong|turbo/.test(e)?"mdi:fan-speed-3":"mdi:fan"}function Pt(t){const e=t.toLowerCase();return"none"===e||"off"===e?"mdi:cancel":e.includes("eco")?"mdi:leaf":e.includes("away")?"mdi:home-export-outline":e.includes("home")?"mdi:home":e.includes("sleep")||e.includes("night")?"mdi:power-sleep":e.includes("boost")||e.includes("turbo")?"mdi:rocket-launch":e.includes("comfort")?"mdi:sofa":e.includes("activity")?"mdi:run-fast":"mdi:tune-variant"}function Zt(t){const e=t.toLowerCase();return"off"===e||"stop"===e||"fixed"===e?"mdi:arrow-expand-vertical":"both"===e||"on"===e||"full"===e?"mdi:arrow-all":e.includes("horizontal")?"mdi:arrow-left-right":e.includes("vertical")?"mdi:arrow-up-down":"mdi:swap-vertical"}function It(t,e){if(!e?.length)return t;const i=new Set(t),s=e.filter(t=>i.has(t)),o=new Set(s);return[...s,...t.filter(t=>!o.has(t))]}function Tt(t){const e=t.trim().toLowerCase();return""===e||"off"===e||"none"===e||"false"===e||"null"===e||"0"===e||"unavailable"===e||"unknown"===e}function Dt(t){return"heat_cool"===t?"Heat/Cool":t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}function Ht(t){return 5*(t-32)/9}function Rt(t){return 1e3*Math.exp(16.6536-4030.183/(t+235))}function Nt(t,e){const i=Math.max(0,Math.min(100,e))/100*Rt(t);return.62198*i/(101325-i)}const Ft={"swing-vertical-fixed-top":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM20.444 6.827A16 16 0 0 1 19.746 9.756L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268Z",secondary:"M19.295 10.929A16 16 0 0 1 17.849 13.57L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM17.104 14.582A16 16 0 0 1 15.012 16.748L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM14.027 17.528A16 16 0 0 1 11.438 19.065L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM10.282 19.557A16 16 0 0 1 7.378 20.357L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z"},"swing-vertical-fixed-upper-middle":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM19.295 10.929A16 16 0 0 1 17.849 13.57L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499Z",secondary:"M20.444 6.827A16 16 0 0 1 19.746 9.756L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM17.104 14.582A16 16 0 0 1 15.012 16.748L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM14.027 17.528A16 16 0 0 1 11.438 19.065L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM10.282 19.557A16 16 0 0 1 7.378 20.357L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z"},"swing-vertical-fixed-middle":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM17.104 14.582A16 16 0 0 1 15.012 16.748L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595Z",secondary:"M20.444 6.827A16 16 0 0 1 19.746 9.756L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM19.295 10.929A16 16 0 0 1 17.849 13.57L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM14.027 17.528A16 16 0 0 1 11.438 19.065L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM10.282 19.557A16 16 0 0 1 7.378 20.357L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z"},"swing-vertical-fixed-lower-middle":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM14.027 17.528A16 16 0 0 1 11.438 19.065L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478Z",secondary:"M20.444 6.827A16 16 0 0 1 19.746 9.756L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM19.295 10.929A16 16 0 0 1 17.849 13.57L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM17.104 14.582A16 16 0 0 1 15.012 16.748L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM10.282 19.557A16 16 0 0 1 7.378 20.357L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z"},"swing-vertical-fixed-bottom":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM10.282 19.557A16 16 0 0 1 7.378 20.357L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z",secondary:"M20.444 6.827A16 16 0 0 1 19.746 9.756L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM19.295 10.929A16 16 0 0 1 17.849 13.57L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM17.104 14.582A16 16 0 0 1 15.012 16.748L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM14.027 17.528A16 16 0 0 1 11.438 19.065L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478Z"},"swing-vertical-top":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM17.077 6.354A12.6 12.6 0 0 1 16.528 8.661L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM16.172 9.584A12.6 12.6 0 0 1 15.034 11.664L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM14.447 12.461A12.6 12.6 0 0 1 12.8 14.167L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM19.935 9.505A16.1 16.1 0 0 1 16.994 14.876L15.762 13.855A14.5 14.5 0 0 0 18.411 9.017ZM19.965 6.785L21.268 9.931L17.077 8.591ZM14.719 16.367L14.684 12.961L18.072 15.77Z",secondary:"M12.024 14.781A12.6 12.6 0 0 1 9.985 15.991L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM9.074 16.379A12.6 12.6 0 0 1 6.788 17.009L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z"},"swing-vertical-middle":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM16.172 9.584A12.6 12.6 0 0 1 15.034 11.664L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM14.447 12.461A12.6 12.6 0 0 1 12.8 14.167L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM12.024 14.781A12.6 12.6 0 0 1 9.985 15.991L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM18.097 13.377A16.1 16.1 0 0 1 13.843 17.782L12.924 16.472A14.5 14.5 0 0 0 16.756 12.505ZM18.844 10.762L19.271 14.141L15.582 11.742ZM11.255 18.62L12.121 15.326L14.647 18.929Z",secondary:"M17.077 6.354A12.6 12.6 0 0 1 16.528 8.661L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM9.074 16.379A12.6 12.6 0 0 1 6.788 17.009L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087Z"},"swing-vertical-bottom":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM14.447 12.461A12.6 12.6 0 0 1 12.8 14.167L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM12.024 14.781A12.6 12.6 0 0 1 9.985 15.991L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM9.074 16.379A12.6 12.6 0 0 1 6.788 17.009L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087ZM15.303 16.628A16.1 16.1 0 0 1 10.037 19.754L9.497 18.248A14.5 14.5 0 0 0 14.239 15.432ZM16.713 14.302L16.233 17.674L13.308 14.387ZM7.319 19.879L9.024 16.93L10.51 21.072Z",secondary:"M17.077 6.354A12.6 12.6 0 0 1 16.528 8.661L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM16.172 9.584A12.6 12.6 0 0 1 15.034 11.664L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499Z"},"swing-vertical-full":{path:"M2.8 2.4L2.8 20.9A0.9 0.9 0 0 0 4.6 20.9L4.6 2.4L2.8 2.4ZM2.8 4.2L20.2 4.2A0.9 0.9 0 0 0 20.2 2.4L2.8 2.4L2.8 4.2ZM17.077 6.354A12.6 12.6 0 0 1 16.528 8.661L9.144 6.147A4.8 4.8 0 0 0 9.353 5.268ZM16.172 9.584A12.6 12.6 0 0 1 15.034 11.664L8.575 7.291A4.8 4.8 0 0 0 9.009 6.499ZM14.447 12.461A12.6 12.6 0 0 1 12.8 14.167L7.724 8.245A4.8 4.8 0 0 0 8.351 7.595ZM12.024 14.781A12.6 12.6 0 0 1 9.985 15.991L6.651 8.94A4.8 4.8 0 0 0 7.428 8.478ZM9.074 16.379A12.6 12.6 0 0 1 6.788 17.009L5.434 9.327A4.8 4.8 0 0 0 6.305 9.087ZM19.935 9.505A16.1 16.1 0 0 1 10.037 19.754L9.497 18.248A14.5 14.5 0 0 0 18.411 9.017ZM19.965 6.785L21.268 9.931L17.077 8.591ZM7.319 19.879L9.024 16.93L10.51 21.072Z"},"swing-horizontal-fixed-left":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM5.188 19.477A16 16 0 0 1 2.595 17.944L9.649 8.236A4 4 0 0 0 10.297 8.619Z",secondary:"M9.249 20.762A16 16 0 0 1 6.344 19.967L10.586 8.742A4 4 0 0 0 11.312 8.94ZM13.506 20.929A16 16 0 0 1 10.494 20.929L11.624 8.982A4 4 0 0 0 12.376 8.982ZM17.656 19.967A16 16 0 0 1 14.751 20.762L12.688 8.94A4 4 0 0 0 13.414 8.742ZM21.405 17.944A16 16 0 0 1 18.812 19.477L13.703 8.619A4 4 0 0 0 14.351 8.236Z"},"swing-horizontal-fixed-left-middle":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM9.249 20.762A16 16 0 0 1 6.344 19.967L10.586 8.742A4 4 0 0 0 11.312 8.94Z",secondary:"M5.188 19.477A16 16 0 0 1 2.595 17.944L9.649 8.236A4 4 0 0 0 10.297 8.619ZM13.506 20.929A16 16 0 0 1 10.494 20.929L11.624 8.982A4 4 0 0 0 12.376 8.982ZM17.656 19.967A16 16 0 0 1 14.751 20.762L12.688 8.94A4 4 0 0 0 13.414 8.742ZM21.405 17.944A16 16 0 0 1 18.812 19.477L13.703 8.619A4 4 0 0 0 14.351 8.236Z"},"swing-horizontal-fixed-middle":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM13.506 20.929A16 16 0 0 1 10.494 20.929L11.624 8.982A4 4 0 0 0 12.376 8.982Z",secondary:"M5.188 19.477A16 16 0 0 1 2.595 17.944L9.649 8.236A4 4 0 0 0 10.297 8.619ZM9.249 20.762A16 16 0 0 1 6.344 19.967L10.586 8.742A4 4 0 0 0 11.312 8.94ZM17.656 19.967A16 16 0 0 1 14.751 20.762L12.688 8.94A4 4 0 0 0 13.414 8.742ZM21.405 17.944A16 16 0 0 1 18.812 19.477L13.703 8.619A4 4 0 0 0 14.351 8.236Z"},"swing-horizontal-fixed-right-middle":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM17.656 19.967A16 16 0 0 1 14.751 20.762L12.688 8.94A4 4 0 0 0 13.414 8.742Z",secondary:"M5.188 19.477A16 16 0 0 1 2.595 17.944L9.649 8.236A4 4 0 0 0 10.297 8.619ZM9.249 20.762A16 16 0 0 1 6.344 19.967L10.586 8.742A4 4 0 0 0 11.312 8.94ZM13.506 20.929A16 16 0 0 1 10.494 20.929L11.624 8.982A4 4 0 0 0 12.376 8.982ZM21.405 17.944A16 16 0 0 1 18.812 19.477L13.703 8.619A4 4 0 0 0 14.351 8.236Z"},"swing-horizontal-fixed-right":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM21.405 17.944A16 16 0 0 1 18.812 19.477L13.703 8.619A4 4 0 0 0 14.351 8.236Z",secondary:"M5.188 19.477A16 16 0 0 1 2.595 17.944L9.649 8.236A4 4 0 0 0 10.297 8.619ZM9.249 20.762A16 16 0 0 1 6.344 19.967L10.586 8.742A4 4 0 0 0 11.312 8.94ZM13.506 20.929A16 16 0 0 1 10.494 20.929L11.624 8.982A4 4 0 0 0 12.376 8.982ZM17.656 19.967A16 16 0 0 1 14.751 20.762L12.688 8.94A4 4 0 0 0 13.414 8.742Z"},"swing-horizontal-left":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM6.635 16.401A12.6 12.6 0 0 1 4.594 15.194L9.649 8.236A4 4 0 0 0 10.297 8.619ZM9.834 17.412A12.6 12.6 0 0 1 7.546 16.787L10.586 8.742A4 4 0 0 0 11.312 8.94ZM13.186 17.544A12.6 12.6 0 0 1 10.814 17.544L11.624 8.982A4 4 0 0 0 12.376 8.982ZM10.783 21.054A16.1 16.1 0 0 1 4.876 19.438L5.584 18.003A14.5 14.5 0 0 0 10.904 19.458ZM13.436 20.453L10.677 22.45L11.009 18.062ZM2.898 17.57L6.203 16.748L4.256 20.693Z",secondary:"M16.454 16.787A12.6 12.6 0 0 1 14.166 17.412L12.688 8.94A4 4 0 0 0 13.414 8.742ZM19.406 15.194A12.6 12.6 0 0 1 17.365 16.401L13.703 8.619A4 4 0 0 0 14.351 8.236Z"},"swing-horizontal-middle":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM9.834 17.412A12.6 12.6 0 0 1 7.546 16.787L10.586 8.742A4 4 0 0 0 11.312 8.94ZM13.186 17.544A12.6 12.6 0 0 1 10.814 17.544L11.624 8.982A4 4 0 0 0 12.376 8.982ZM16.454 16.787A12.6 12.6 0 0 1 14.166 17.412L12.688 8.94A4 4 0 0 0 13.414 8.742ZM15.062 20.806A16.1 16.1 0 0 1 8.938 20.806L9.242 19.235A14.5 14.5 0 0 0 14.758 19.235ZM17.462 19.526L15.328 22.181L14.491 17.861ZM6.538 19.526L9.509 17.861L8.672 22.181Z",secondary:"M6.635 16.401A12.6 12.6 0 0 1 4.594 15.194L9.649 8.236A4 4 0 0 0 10.297 8.619ZM19.406 15.194A12.6 12.6 0 0 1 17.365 16.401L13.703 8.619A4 4 0 0 0 14.351 8.236Z"},"swing-horizontal-right":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM13.186 17.544A12.6 12.6 0 0 1 10.814 17.544L11.624 8.982A4 4 0 0 0 12.376 8.982ZM16.454 16.787A12.6 12.6 0 0 1 14.166 17.412L12.688 8.94A4 4 0 0 0 13.414 8.742ZM19.406 15.194A12.6 12.6 0 0 1 17.365 16.401L13.703 8.619A4 4 0 0 0 14.351 8.236ZM19.124 19.438A16.1 16.1 0 0 1 13.217 21.054L13.096 19.458A14.5 14.5 0 0 0 18.416 18.003ZM21.102 17.57L19.744 20.693L17.797 16.748ZM10.564 20.453L12.991 18.062L13.323 22.45Z",secondary:"M6.635 16.401A12.6 12.6 0 0 1 4.594 15.194L9.649 8.236A4 4 0 0 0 10.297 8.619ZM9.834 17.412A12.6 12.6 0 0 1 7.546 16.787L10.586 8.742A4 4 0 0 0 11.312 8.94Z"},"swing-horizontal-full":{path:"M3.6 6L20.4 6A1 1 0 0 0 20.4 4L3.6 4A1 1 0 0 0 3.6 6ZM6.635 16.401A12.6 12.6 0 0 1 4.594 15.194L9.649 8.236A4 4 0 0 0 10.297 8.619ZM9.834 17.412A12.6 12.6 0 0 1 7.546 16.787L10.586 8.742A4 4 0 0 0 11.312 8.94ZM13.186 17.544A12.6 12.6 0 0 1 10.814 17.544L11.624 8.982A4 4 0 0 0 12.376 8.982ZM16.454 16.787A12.6 12.6 0 0 1 14.166 17.412L12.688 8.94A4 4 0 0 0 13.414 8.742ZM19.406 15.194A12.6 12.6 0 0 1 17.365 16.401L13.703 8.619A4 4 0 0 0 14.351 8.236ZM19.124 19.438A16.1 16.1 0 0 1 4.876 19.438L5.584 18.003A14.5 14.5 0 0 0 18.416 18.003ZM21.102 17.57L19.744 20.693L17.797 16.748ZM2.898 17.57L6.203 16.748L4.256 20.693Z"}},jt=wt(class extends xt{constructor(t){if(super(t),1!==t.type||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(e=>t[e]).join(" ")+" "}update(t,[e]){if(void 0===this.st){this.st=new Set,void 0!==t.strings&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter(t=>""!==t)));for(const t in e)e[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(e)}const i=t.element.classList;for(const t of this.st)t in e||(i.remove(t),this.st.delete(t));for(const t in e){const s=!!e[t];s===this.st.has(t)||this.nt?.has(t)||(s?(i.add(t),this.st.add(t)):(i.remove(t),this.st.delete(t)))}return B}});var Ut;try{CSS.registerProperty?.({name:"--dial-color",syntax:"<color>",inherits:!0,initialValue:"transparent"})}catch{}const Vt=["cool","heat","heat_cool","auto","dry","fan_only"],qt=160,Bt=225,Wt=270;function Kt(t,e){const i=(t-90)*Math.PI/180;return{x:qt+e*Math.cos(i),y:qt+e*Math.sin(i)}}let Xt=Ut=class extends ct{constructor(){super(...arguments),this.value=20,this.min=7,this.max=35,this.step=.5,this.mode="off",this.modeLabel="",this.unit="°C",this.showCurrentAsPrimary=!1,this.disabled=!1,this.dual=!1,this._dragging=!1,this._dragValue=0,this._dragLow=0,this._dragHigh=0,this._activeHandle=null,this._selected=null,this._pressX=0,this._pressY=0,this._tapArmed=!1,this._wipeFrom=null,this._prevOff=!1,this._showRangeTimer=!1,this._onPointerDown=t=>{!this.disabled&&this._isRingHit(t.clientX,t.clientY)&&(this._pressX=t.clientX,this._pressY=t.clientY,"touch"!==t.pointerType?(this._beginDrag(t,null),this._emitFromValue(this._valueFromPoint(t.clientX,t.clientY))):this._tapArmed=!0)},this._onPointerMove=t=>{this._tapArmed&&this._movedPastSlop(t)&&(this._tapArmed=!1),this._dragging&&this._emitFromValue(this._valueFromPoint(t.clientX,t.clientY))},this._onPointerUp=t=>{if(this._tapArmed)return this._tapArmed=!1,void this._commitTap(t);this._dragging&&this._endDrag(t)},this._onPointerCancel=t=>{this._tapArmed=!1,this._dragging&&this._endDrag(t)},this._onKeyDown=t=>{if(this.disabled||this.dual)return;let e;"ArrowUp"===t.key||"ArrowRight"===t.key?e=this.value+this.step:"ArrowDown"!==t.key&&"ArrowLeft"!==t.key||(e=this.value-this.step),void 0!==e&&(t.preventDefault(),this._emit("value-changed",{value:this._roundToStep(e)}))}}get _dualActive(){return this.dual?"cool"===this.mode?"cool":"heat"===this.mode?"heat":null==this.current?null:this.current>this._displayHigh?"cool":this.current<this._displayLow?"heat":null:null}get _selSide(){return this._selected?this._selected:null==this.current||Math.abs(this.current-this._displayLow)<=Math.abs(this.current-this._displayHigh)?"low":"high"}get _effectiveMode(){return this.dual?this._dualActive??"heat_cool":this.mode}get _demandSensible(){return null!=this.current&&("cool"===this.mode?this.current>this._displayValue:"heat"!==this.mode||this.current<this._displayValue)}get _dialColor(){return Vt.includes(this._effectiveMode)?Ot(this._effectiveMode):Ut.IDLE_COLOR}get _showRange(){return this._dragging||this._showRangeTimer||null===this._dualActive}get _centerTight(){const t=t=>{if(null==t)return!1;const e=(this._angleOf(t)%360+360)%360;return Math.min(Math.abs(e-90),Math.abs(e-270))<=26};return this.dual?t(this._displayLow)||t(this._displayHigh)||!this.showCurrentAsPrimary&&t(this.current):t(this.showCurrentAsPrimary?this._displayValue:this.current)&&this._singleReadoutWide}get _singleReadoutWide(){const t=this.showCurrentAsPrimary&&null!=this.current?this.current:this._displayValue,e=this.showCurrentAsPrimary?1:this._precision;return this._fmt(t,e).length>=4}_bumpRangeDisplay(){this._showRangeTimer=!0,this._rangeTimer&&clearTimeout(this._rangeTimer),this._rangeTimer=window.setTimeout(()=>{this._showRangeTimer=!1},5e3)}disconnectedCallback(){super.disconnectedCallback(),this._rangeTimer&&clearTimeout(this._rangeTimer)}get _precision(){return this.step<1?1:0}get _displayValue(){return this._dragging?this._dragValue:this.value}get _displayLow(){return this._dragging?this._dragLow:this.lowValue??this.min}get _displayHigh(){return this._dragging?this._dragHigh:this.highValue??this.max}_angleOf(t){const e=(t-this.min)/(this.max-this.min||1);return Bt+Math.min(1,Math.max(0,e))*Wt}_fracOf(t){return(this._angleOf(t)-Bt)/Wt}_roundToStep(t){const e=Math.min(this.max,Math.max(this.min,t)),i=Math.round(e/this.step)*this.step;return parseFloat(i.toFixed(this._precision))}_isRingHit(t,e){const i=this._svg.getBoundingClientRect(),s=i.width/320||1,o=t-(i.left+i.width/2),r=e-(i.top+i.height/2),a=Math.hypot(o,r)/s;if(a<98||a>152)return!1;let n=180*Math.atan2(r,o)/Math.PI+90;return n=(n%360+360)%360,n>=Bt||n<=135}_valueFromPoint(t,e){const i=this._svg.getBoundingClientRect(),s=i.left+i.width/2,o=i.top+i.height/2;let r,a=180*Math.atan2(e-o,t-s)/Math.PI+90;a=(a%360+360)%360,r=a>=Bt?a-Bt:a<=135?a+360-Bt:a<180?Wt:0;const n=Math.min(1,Math.max(0,r/Wt));return this._roundToStep(this.min+n*(this.max-this.min))}_applyDual(t){"low"===this._activeHandle?this._dragLow=Math.min(t,this._dragHigh-this.step):this._dragHigh=Math.max(t,this._dragLow+this.step)}_emitFromValue(t){this.dual?(this._applyDual(t),this._emit("value-changing",{low:this._dragLow,high:this._dragHigh})):(this._dragValue=t,this._emit("value-changing",{value:t}))}_movedPastSlop(t){return Math.hypot(t.clientX-this._pressX,t.clientY-this._pressY)>10}_beginDrag(t,e){t.preventDefault(),this._svg.setPointerCapture(t.pointerId),this._tapArmed=!1;const i=this._displayLow,s=this._displayHigh,o=this._displayValue;if(this._dragging=!0,this.dual){if(this._dragLow=i,this._dragHigh=s,e)this._activeHandle=e;else{const e=this._valueFromPoint(t.clientX,t.clientY);this._activeHandle=Math.abs(e-this._dragLow)<=Math.abs(e-this._dragHigh)?"low":"high"}this._selected=this._activeHandle}else this._dragValue=o}_endDrag(t){this._svg.releasePointerCapture(t.pointerId),this._dragging=!1,this.dual?(this._emit("value-changed",{low:this._dragLow,high:this._dragHigh}),this._activeHandle=null):this._emit("value-changed",{value:this._dragValue})}_commitTap(t){const e=this._valueFromPoint(t.clientX,t.clientY);if(this.dual){const t=this._displayLow,i=this._displayHigh;Math.abs(e-t)<=Math.abs(e-i)?(this._selected="low",this._emit("value-changed",{low:Math.min(e,i-this.step),high:i})):(this._selected="high",this._emit("value-changed",{low:t,high:Math.max(e,t+this.step)}))}else this._emit("value-changed",{value:e})}_onHandlePointerDown(t,e){this.disabled||(t.stopPropagation(),this._beginDrag(t,e))}_step(t){if(!this.disabled)if(this.dual)if("low"===this._selSide){const e=Math.min(this._roundToStep(this._displayLow+t*this.step),this._displayHigh-this.step);this._emit("value-changed",{low:e,high:this._displayHigh})}else{const e=Math.max(this._roundToStep(this._displayHigh+t*this.step),this._displayLow+this.step);this._emit("value-changed",{low:this._displayLow,high:e})}else this._emit("value-changed",{value:this._roundToStep(this.value+t*this.step)})}_emit(t,e){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}_fmt(t,e){return null==t||Number.isNaN(t)?"—":t.toFixed(e)}_fmtCompact(t){return null==t||Number.isNaN(t)?"—":Number.isInteger(t)?String(t):t.toFixed(1)}_dotOrbit(t,e){return V`<div class="orbit" style=${`transform: rotate(${t}deg)`}>
      <div class="o-dot ${e}"></div>
    </div>`}_labelOrbit(t,e){return V`<div class="orbit" style=${`transform: rotate(${t}deg)`}>
      <div class="o-label" style=${`transform: translate(-50%, -50%) rotate(${-t}deg)`}>
        ${e}
      </div>
    </div>`}_handleOrbit(t,e){return V`<div class="orbit" style=${`transform: rotate(${t}deg)`}>
      <div
        class="handle"
        @pointerdown=${t=>this._onHandlePointerDown(t,e)}
      ></div>
    </div>`}updated(t){if(this.dual&&(t.has("lowValue")||t.has("highValue"))&&((void 0!==this._prevLow&&this._prevLow!==this.lowValue||void 0!==this._prevHigh&&this._prevHigh!==this.highValue)&&this._bumpRangeDisplay(),this._prevLow=this.lowValue,this._prevHigh=this.highValue),!t.has("mode"))return;const e=this._dialColor,i=!Vt.includes(this.mode);this.dual||void 0===this._prevColor||this._prevColor===e||i||this._prevOff||(this._wipeFrom=this._prevColor,this.updateComplete.then(()=>this._runWipe())),this._prevColor=e,this._prevOff=i}_runWipe(){const t=this.renderRoot.querySelector(".value:not(.wipe-value)"),e=this.renderRoot.querySelector(".wipe-value"),i=()=>{this._wipeFrom=null};if(!t||!e)return i();const s=parseFloat(t.getAttribute("stroke-dasharray")),o=-parseFloat(t.getAttribute("stroke-dashoffset"));if(s<=0)return i();const r={duration:460,easing:"cubic-bezier(0.2, 0, 0, 1)"};t.animate([{strokeDasharray:"0 1000",strokeDashoffset:"0"},{strokeDasharray:`${s} 1000`,strokeDashoffset:""+-o}],r),e.animate([{strokeDasharray:`${s} 1000`,strokeDashoffset:""+-o},{strokeDasharray:`${s} 1000`,strokeDashoffset:"-1000"}],{...r,fill:"forwards"}).finished.then(i,i)}render(){const t=!Vt.includes(this.mode),e=this._dialColor,i=Et[this.mode]??"mdi:thermostat",s=null!=this.current&&this.current>=this.min&&this.current<=this.max,o=this._angleOf(this._displayValue),r=s?this._angleOf(this.current):0,a=!this.dual&&s&&!t&&Math.abs(o-r)<18,n=this._angleOf(this._displayLow),l=this._angleOf(this._displayHigh),c=this.dual?this._selSide:null,d=function(t,e,i){const s=Kt(225,i),o=Kt(495,i);return`M ${s.x} ${s.y} A 130 130 0 1 1 ${o.x} ${o.y}`}(0,0,130);let h=0,p=0,u=!1,m=e;this.dual||!s||t||(h=Math.min(this._fracOf(this._displayValue),this._fracOf(this.current)),p=Math.max(this._fracOf(this._displayValue),this._fracOf(this.current)),u=!0,m=this._demandSensible?e:Ut.IDLE_COLOR);const f=`${(1e3*(p-h)).toFixed(2)} 1000`,v=(1e3*-h).toFixed(2),g=[];if(this.dual){const t=this._fracOf(this._displayLow),i=this._fracOf(this._displayHigh),o=this._dualActive;g.push({from:t,to:i,color:null===o?e:Ut.IDLE_COLOR,opacity:null===o?1:.5,cls:"range"});const r=s?this._fracOf(this.current):i,a=null!=this.current&&this.current>=(this._displayLow+this._displayHigh)/2;g.push({from:a?i:Math.min(t,r),to:a?Math.max(i,r):t,color:Ot(a?"cool":"heat"),opacity:null===o?0:1,cls:"demand"})}const _=this._dualActive,b=this.dual&&!this._showRange,y=V`<span class="num current">${this._fmtCompact(this.current)}°</span>`,w=V`<ha-icon class="mode-icon" icon=${i}></ha-icon>`,x=V`<ha-icon
      class="mode-icon"
      icon=${Et["cool"===_?"cool":"heat"]}
    ></ha-icon>`,$=this.dual&&s&&!this.showCurrentAsPrimary,A=b&&"heat"===_&&!this.showCurrentAsPrimary?x:V`<span class="num ${"low"===c?"sel":""}"
            >${this._fmtCompact(this._displayLow)}°</span
          >`,k=b&&"cool"===_&&!this.showCurrentAsPrimary?x:V`<span class="num ${"high"===c?"sel":""}"
            >${this._fmtCompact(this._displayHigh)}°</span
          >`,L=$?[n,l,r]:[n,l],M=this.dual?function(t){const e=t.length;if(e<2)return t.slice();const i=t.map((t,e)=>e).sort((e,i)=>t[e]-t[i]),s=i.map((e,i)=>t[e]-24*i),o=function(t){const e=[],i=[];for(const s of t)for(e.push(s),i.push(1);e.length>1&&e[e.length-2]>e[e.length-1];){const t=e.pop(),s=i.pop(),o=e.pop(),r=i.pop();e.push((o*r+t*s)/(r+s)),i.push(r+s)}const s=[];return e.forEach((t,e)=>{for(let o=0;o<i[e];o++)s.push(t)}),s}(s),r=new Array(e);i.forEach((t,e)=>{r[t]=o[e]+24*e});{const t=Math.min(...r),i=Math.max(...r);let s=0;if(t<225?s=225-t:i>495&&(s=495-i),0!==s)for(let t=0;t<e;t++)r[t]+=s}return r}(L):[];return V`
      <div
        class=${jt({dial:!0,off:t,disabled:this.disabled})}
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
          @pointercancel=${this._onPointerCancel}
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
          <circle class="glow" cx=${qt} cy=${qt} r="150" fill="url(#mt-glow)" />
          <path class="ring" d=${d} />
          ${this.dual?g.map(t=>q`<path
                  class=${`value ${t.cls}`}
                  d=${d}
                  pathLength="1000"
                  stroke-dasharray=${`${(1e3*Math.max(0,t.to-t.from)).toFixed(2)} 1000`}
                  stroke-dashoffset=${(1e3*-t.from).toFixed(2)}
                  style=${`opacity:${t.opacity};stroke:${t.color}`}
                />`):q`<path
                class="value"
                d=${d}
                pathLength="1000"
                stroke-dasharray=${f}
                stroke-dashoffset=${v}
                style=${`opacity:${u?1:0};stroke:${m}`}
              />`}
          <path class="hit" d=${d} />
          ${!this.dual&&this._wipeFrom&&u?q`<path
                class="value wipe-value"
                d=${d}
                pathLength="1000"
                stroke-dasharray=${f}
                stroke-dashoffset=${v}
                style=${`stroke:${this._wipeFrom};opacity:1`}
              />`:W}
        </svg>

        <div class="markers">
          ${this.dual?V`
                ${this._dotOrbit(n,"setpoint"+("low"===c?" sel":""))}
                ${this._dotOrbit(l,"setpoint"+("high"===c?" sel":""))}
                ${s?this._dotOrbit(r,"current"):W}
                ${this._labelOrbit(M[0],A)}
                ${this._labelOrbit(M[1],k)}
                ${$?this._labelOrbit(M[2],y):W}
                ${this._handleOrbit(n,"low")}
                ${this._handleOrbit(l,"high")}
              `:V`
                ${this._dotOrbit(o,"setpoint")}
                ${s?this._dotOrbit(r,"current"):W}
                ${this.showCurrentAsPrimary?this._labelOrbit(o,V`<span class="num">${this._fmtCompact(this._displayValue)}°</span>`):a?this._labelOrbit(r,V`<span class="num current with-icon"
                          ><ha-icon class="mode-icon inline" icon=${i}></ha-icon
                          >${this._fmtCompact(this.current)}°</span
                        >`):V`
                        ${t?W:this._labelOrbit(o,w)}
                        ${s?this._labelOrbit(r,y):W}
                      `}
                ${this._handleOrbit(o,null)}
              `}
        </div>

        ${this.dual?this._renderDualCenter():this._renderSingleCenter()}
        ${this._renderPresetIcon()} ${this._renderAdjust()}
      </div>
    `}_renderStatus(){return this.disabled&&this.modeLabel?V`<div class="mode">${this.modeLabel}</div>`:W}_renderPresetIcon(){return this.presetIcon?V`<ha-icon class="preset-icon" icon=${this.presetIcon}></ha-icon>`:W}_renderSingleCenter(){const t=this._displayValue,e=this.showCurrentAsPrimary&&null!=this.current?this.current:t,i=this.showCurrentAsPrimary?1:this._precision;return V`
      <div class=${jt({center:!0,tight:this._centerTight})}>
        ${this._renderStatus()}
        <div class="temp">
          <span class="value-text">${this._fmt(e,i)}</span>
          <span class="unit">${this.unit}</span>
        </div>
      </div>
    `}_renderDualCenter(){if(this._showRange){const t=this._dragging||this._showRangeTimer;return V`
        <div class=${jt({center:!0,tight:this._centerTight})}>
          ${this._renderStatus()}
          <div class=${jt({temp:!0,dual:!0,settled:!t})}>
            <span class="value-text">${this._fmt(this._displayLow,this._precision)}</span>
            <span class="dash">–</span>
            <span class="value-text">${this._fmt(this._displayHigh,this._precision)}</span>
            <span class="unit">${this.unit}</span>
          </div>
        </div>
      `}const t="cool"===this._dualActive?this._displayHigh:this._displayLow,e=this.showCurrentAsPrimary&&null!=this.current?this.current:t,i=this.showCurrentAsPrimary?1:this._precision;return V`
      <div class=${jt({center:!0,tight:this._centerTight})}>
        ${this._renderStatus()}
        <div class="temp">
          <span class="value-text">${this._fmt(e,i)}</span>
          <span class="unit">${this.unit}</span>
        </div>
      </div>
    `}_renderAdjust(){return V`
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
    `}};Xt.IDLE_COLOR="var(--mt-on-surface-variant)",Xt.styles=[St,a`
      :host {
        display: block;
        /* Fill the wrapper so the dial has a DEFINITE width. A container
           (container-type below) reports zero intrinsic width, so without this
           the shrink-to-fit host would collapse to ~0 and the dial vanishes. */
        width: 100%;
        /* no grey flash when a tap lands on the dial (mobile WebKit/Blink) */
        -webkit-tap-highlight-color: transparent;
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
        /* The orbiting marker layers are full-size squares rotated to ride the
           arc; a rotated square's corners poke past the dial box. Clip them here
           so they don't add page-level horizontal overflow on mobile (the corners
           are empty, so nothing visible is lost). */
        overflow: hidden;
      }
      svg {
        display: block; /* avoid inline baseline gap that offsets the SVG vs marker overlays */
        width: 100%;
        height: 100%;
        /* A swipe over the dial scrolls the page; a tap on the ring sets the
           temperature; scrubbing is done by dragging a setpoint handle (which
           claims its own gesture). */
        touch-action: pan-y;
        outline: none;
        /* the dial is tap/drag controlled — no text selection or grey tap flash */
        -webkit-tap-highlight-color: transparent;
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
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
        /* a swipe here scrolls the page (pan-y); a tap sets the temperature —
           the gesture is only swallowed when dragging a setpoint handle */
        touch-action: pan-y;
        cursor: pointer;
      }
      .dial.disabled .hit {
        cursor: default;
      }
      /* Invisible, finger-sized drag target centered on a setpoint dot. It rides
         the ring via the same orbit/rotate as the markers. Dragging it scrubs
         the dial; touch-action:none keeps a scroll from interrupting the drag. */
      .handle {
        position: absolute;
        left: 50%;
        top: 9.375%; /* on the ring centerline, like .o-dot */
        width: clamp(34px, 16cqi, 48px);
        height: clamp(34px, 16cqi, 48px);
        transform: translate(-50%, -50%);
        border-radius: 50%;
        pointer-events: auto;
        touch-action: none;
        cursor: grab;
        -webkit-tap-highlight-color: transparent;
      }
      .handle:active {
        cursor: grabbing;
      }
      .dial.disabled .handle {
        pointer-events: none;
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
        transition:
          box-shadow var(--mt-motion-dur) var(--mt-motion-ease),
          transform var(--mt-motion-dur) var(--mt-motion-ease);
      }
      /* The setpoint the +/- buttons act on (dual mode): a ring in the dial color
         around the dot makes the active handle obvious. */
      .o-dot.setpoint.sel {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--dial-color) 70%, transparent);
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
      /* The selected setpoint's number, tinted to match its highlighted dot. */
      .o-label .num.sel {
        color: var(--dial-color);
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
      /* Preset icon (à la Google Home's eco leaf) — pinned just above the +/-
         controls and horizontally centered, so it never shifts the temperature
         off the dial's true center. */
      .preset-icon {
        position: absolute;
        left: 50%;
        top: 70%;
        transform: translate(-50%, -50%);
        --mdc-icon-size: clamp(14px, 7cqi, 22px);
        color: var(--mt-on-surface-variant);
        pointer-events: none;
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
      /* The heat/cool range packs two numbers + a dash + unit across the dial, so
         it is sized well below the single-mode hero number — even while being
         actively changed — and shrinks a touch more once it settles. */
      .temp.dual .value-text {
        font-size: clamp(13px, 7cqi, 24px);
      }
      .temp.dual .dash {
        font-size: clamp(13px, 7cqi, 24px);
        color: var(--mt-on-surface-variant);
      }
      /* At rest (not dragging / >5s after a change) the range shrinks so it isn't
         oversized when it's just sitting there idle. */
      .temp.dual.settled .value-text,
      .temp.dual.settled .dash {
        font-size: clamp(12px, 5.5cqi, 20px);
      }
      /* A numeric marker near 3/9 o'clock crowds the centre readout — shrink and
         allow the value/unit to wrap so the orbiting labels don't overlap it. */
      .center.tight .temp {
        max-width: 46%;
        flex-wrap: wrap;
        justify-content: center;
      }
      .center.tight .value-text {
        font-size: clamp(13px, 14cqi, 46px);
      }
      .center.tight .unit {
        font-size: clamp(9px, 5cqi, 16px);
      }
      .center.tight .temp.dual .value-text,
      .center.tight .temp.dual .dash {
        font-size: clamp(12px, 7cqi, 22px);
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
    `],t([mt({type:Number})],Xt.prototype,"value",void 0),t([mt({type:Number})],Xt.prototype,"min",void 0),t([mt({type:Number})],Xt.prototype,"max",void 0),t([mt({type:Number})],Xt.prototype,"step",void 0),t([mt({type:Number})],Xt.prototype,"current",void 0),t([mt()],Xt.prototype,"mode",void 0),t([mt()],Xt.prototype,"modeLabel",void 0),t([mt()],Xt.prototype,"presetIcon",void 0),t([mt()],Xt.prototype,"unit",void 0),t([mt({type:Boolean})],Xt.prototype,"showCurrentAsPrimary",void 0),t([mt({type:Boolean})],Xt.prototype,"disabled",void 0),t([mt({type:Boolean})],Xt.prototype,"dual",void 0),t([mt({type:Number})],Xt.prototype,"lowValue",void 0),t([mt({type:Number})],Xt.prototype,"highValue",void 0),t([ft()],Xt.prototype,"_dragging",void 0),t([ft()],Xt.prototype,"_dragValue",void 0),t([ft()],Xt.prototype,"_dragLow",void 0),t([ft()],Xt.prototype,"_dragHigh",void 0),t([ft()],Xt.prototype,"_activeHandle",void 0),t([ft()],Xt.prototype,"_selected",void 0),t([ft()],Xt.prototype,"_wipeFrom",void 0),t([ft()],Xt.prototype,"_showRangeTimer",void 0),t([vt("svg")],Xt.prototype,"_svg",void 0),Xt=Ut=t([ht("mt-circular-dial")],Xt);const Yt=a`
  .tile {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    min-height: 56px;
    box-sizing: border-box;
    border: none;
    /* "off" tiles are squarer rounded rectangles; "on" tiles morph to the
       extra-rounded card shape (see the .tile.on rule below). */
    border-radius: var(--mt-shape-chip-square);
    background: var(--mt-surface-container);
    color: var(--mt-on-surface);
    cursor: pointer;
    font: inherit;
    text-align: left;
    transition:
      background-color 200ms cubic-bezier(0.2, 0, 0, 1),
      border-radius 260ms cubic-bezier(0.2, 0, 0, 1),
      color 200ms cubic-bezier(0.2, 0, 0, 1);
    -webkit-tap-highlight-color: transparent;
  }
  .tile:hover {
    background: color-mix(in srgb, var(--mt-on-surface) 6%, var(--mt-surface-container));
  }
  .tile:active {
    background: color-mix(in srgb, var(--mt-on-surface) 12%, var(--mt-surface-container));
  }
  .tile.on {
    /* extra-rounded corners + a soft tint of the accent (the HVAC mode color
       for the climate selector, else the primary). */
    border-radius: var(--mt-shape-card);
    background: color-mix(in srgb, var(--mt-tile-accent, var(--mt-primary)) 16%, var(--mt-surface-container));
    color: var(--mt-tile-accent, var(--mt-primary));
  }
  .tile.on:hover {
    background: color-mix(in srgb, var(--mt-tile-accent, var(--mt-primary)) 22%, var(--mt-surface-container));
  }
  .tile .ic {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border-radius: var(--mt-shape-full);
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--mt-on-surface-variant) 14%, transparent);
    color: var(--mt-on-surface-variant);
    transition:
      background-color 200ms cubic-bezier(0.2, 0, 0, 1),
      color 200ms cubic-bezier(0.2, 0, 0, 1);
  }
  .tile.on .ic {
    background: color-mix(in srgb, var(--mt-tile-accent, var(--mt-primary)) 26%, transparent);
    color: var(--mt-tile-accent, var(--mt-primary));
  }
  .tile .ic ha-icon {
    --mdc-icon-size: 22px;
  }
  .tile .ic .dot {
    background: currentColor;
  }
  .tile .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .tile .title {
    font-size: var(--md-sys-typescale-label-medium-size, 13px);
    font-weight: 500;
    color: var(--mt-on-surface-variant);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tile.on .title {
    color: currentColor;
  }
  .tile .value {
    font-size: var(--md-sys-typescale-body-large-size, 16px);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--mt-on-surface-variant);
    flex: 0 0 auto;
  }
`;let Gt=class extends ct{constructor(){super(...arguments),this.items=[],this.placeholder="",this.variant="pill",this.label="",this.forceOff=!1,this._open=!1,this._up=!1,this._alignRight=!1,this._onDocClick=t=>{this._open&&!t.composedPath().includes(this)&&(this._open=!1)},this._onOtherOpen=t=>{t.detail!==this&&(this._open=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocClick),document.addEventListener("mt-dropdown-open",this._onOtherOpen)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocClick),document.removeEventListener("mt-dropdown-open",this._onOtherOpen)}get _active(){return this.items.find(t=>t.active)??this.items[0]}get _tileOn(){if(this.forceOff)return!1;const t=this.items.find(t=>t.active);return!!t&&!Tt(t.value)}_toggle(t){if(t.stopPropagation(),!this._open){const t=this.getBoundingClientRect();this._up=t.bottom>.55*window.innerHeight,this._alignRight=t.left+t.width/2>.5*window.innerWidth,document.dispatchEvent(new CustomEvent("mt-dropdown-open",{detail:this}))}this._open=!this._open}_select(t,e){t.stopPropagation(),this._open=!1,this.dispatchEvent(new CustomEvent("item-selected",{detail:{value:e}}))}render(){const t=this._active,e="tile"===this.variant?this._renderTile(t):this._renderPill(t);return V`${e}${this._open?this._renderMenu():W}`}_renderPill(t){return V`
      <button
        class=${jt({trigger:!0,open:this._open})}
        aria-haspopup="listbox"
        aria-expanded=${this._open?"true":"false"}
        @click=${this._toggle}
      >
        ${t?.icon?V`<ha-icon class="lead" icon=${t.icon}></ha-icon>`:V`<span class="dot"></span>`}
        <span class="label">${t?.label??this.placeholder}</span>
        <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
      </button>
    `}_renderTile(t){return V`
      <button
        class=${jt({tile:!0,on:this._tileOn,open:this._open})}
        aria-haspopup="listbox"
        aria-expanded=${this._open?"true":"false"}
        @click=${this._toggle}
      >
        <div class="ic">
          ${t?.icon?V`<ha-icon icon=${t.icon}></ha-icon>`:V`<span class="dot"></span>`}
        </div>
        <div class="text">
          ${this.label?V`<div class="title">${this.label}</div>`:W}
          <div class="value">${t?.label??this.placeholder}</div>
        </div>
      </button>
    `}_renderMenu(){return V`<div
      class=${jt({menu:!0,up:this._up,right:this._alignRight})}
      role="listbox"
    >
      ${this.items.map(t=>V`<button
          class=${jt({opt:!0,active:!!t.active})}
          role="option"
          aria-selected=${t.active?"true":"false"}
          @click=${e=>this._select(e,t.value)}
        >
          ${t.icon?V`<ha-icon icon=${t.icon}></ha-icon>`:V`<span class="dot"></span>`}
          <span class="label">${t.label}</span>
          ${t.active?V`<ha-icon class="check" icon="mdi:check"></ha-icon>`:W}
        </button>`)}
    </div>`}};Gt.styles=[St,Yt,a`
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
    `],t([mt({attribute:!1})],Gt.prototype,"items",void 0),t([mt()],Gt.prototype,"placeholder",void 0),t([mt()],Gt.prototype,"variant",void 0),t([mt()],Gt.prototype,"label",void 0),t([mt({type:Boolean})],Gt.prototype,"forceOff",void 0),t([ft()],Gt.prototype,"_open",void 0),t([ft()],Gt.prototype,"_up",void 0),t([ft()],Gt.prototype,"_alignRight",void 0),Gt=t([ht("mt-dropdown")],Gt);let Jt=class extends ct{constructor(){super(...arguments),this.items=[],this.display="icons",this.forceOff=!1}_select(t){this.dispatchEvent(new CustomEvent("item-selected",{detail:{value:t},bubbles:!0,composed:!0}))}render(){if(!this.items.length)return W;if("tile"===this.display)return this._renderTile();const t="dropdown"===this.display?this._renderDropdown():this._renderIcons();return V`${this.label?V`<div class="title">${this.label}</div>`:W}${t}`}_renderIcons(){return V`
      <div class="chips" role="group" aria-label=${this.label??"options"}>
        ${this.items.map(t=>V`
            <button
              class=${jt({chip:!0,active:!!t.active})}
              ?disabled=${t.disabled}
              title=${t.label}
              aria-label=${t.label}
              aria-pressed=${t.active?"true":"false"}
              @click=${()=>this._select(t.value)}
            >
              ${t.icon?V`<ha-icon icon=${t.icon}></ha-icon>`:V`<span class="chip-text">${t.label}</span>`}
            </button>
          `)}
      </div>
    `}_renderDropdown(){return V`<mt-dropdown
      .items=${this.items}
      .placeholder=${this.label??""}
      @item-selected=${t=>this._select(t.detail.value)}
    ></mt-dropdown>`}_renderTile(){return V`<mt-dropdown
      variant="tile"
      .items=${this.items}
      .label=${this.label??""}
      .forceOff=${this.forceOff}
      @item-selected=${t=>this._select(t.detail.value)}
    ></mt-dropdown>`}};Jt.styles=[St,a`
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }
      .title {
        color: var(--mt-on-surface-variant);
        font-size: var(--md-sys-typescale-label-large-size, 13px);
        font-weight: 500;
        padding: 0 4px 6px;
      }
      .chips {
        display: flex;
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
    `],t([mt({attribute:!1})],Jt.prototype,"items",void 0),t([mt()],Jt.prototype,"display",void 0),t([mt()],Jt.prototype,"label",void 0),t([mt({type:Boolean})],Jt.prototype,"forceOff",void 0),Jt=t([ht("mt-selector-row")],Jt);const Qt={hvac:"Mode",fan:"Fan",swing:"Swing",preset:"Preset"};let te=class extends ct{constructor(){super(...arguments),this.kind="hvac",this.display="icons"}get _stateObj(){return this.hass?.states?.[this.entityId]}_overrideMap(){const t=new Map;return(this.options??[]).forEach(e=>t.set(e.value,e)),t}_build(){const t=this._stateObj;if(!t)return[];const e=this._overrideMap();let i,s,o=[];return"hvac"===this.kind?(o=t.attributes.hvac_modes??[],i=t.state,s=t=>Et[t]??"mdi:thermostat"):"fan"===this.kind?(o=t.attributes.fan_modes??[],i=t.attributes.fan_mode,s=t=>zt(t)):"preset"===this.kind?(o=t.attributes.preset_modes??[],i=t.attributes.preset_mode,s=t=>Pt(t)):(o=t.attributes.swing_modes??[],i=t.attributes.swing_mode,s=t=>Zt(t)),It(o,this.order).filter(t=>!e.get(t)?.hide).map(t=>({value:t,label:e.get(t)?.label??Dt(t),icon:e.get(t)?.icon??s(t),active:t===i}))}_onSelect(t){const e=t.detail.value;if(!this._stateObj)return;const i=this.entityId;"hvac"===this.kind?this.hass.callService("climate","set_hvac_mode",{entity_id:i,hvac_mode:e}):"fan"===this.kind?this.hass.callService("climate","set_fan_mode",{entity_id:i,fan_mode:e}):"preset"===this.kind?this.hass.callService("climate","set_preset_mode",{entity_id:i,preset_mode:e}):this.hass.callService("climate","set_swing_mode",{entity_id:i,swing_mode:e})}render(){const t=this._build();if(!t.length)return W;const e="hvac"===this.kind?`--mt-selected-bg: var(--md-sys-color-primary, ${Ot(this._stateObj?.state)}); --mt-selected-fg: var(--md-sys-color-on-primary, #fff); --mt-tile-accent: ${Ot(this._stateObj?.state)};`:W,i=this.label??("tile"===this.display?Qt[this.kind]:void 0),s="off"===this._stateObj.state;return V`
      <mt-selector-row
        .items=${t}
        display=${this.display}
        .label=${i}
        .forceOff=${s}
        style=${e}
        @item-selected=${this._onSelect}
      ></mt-selector-row>
    `}};t([mt({attribute:!1})],te.prototype,"hass",void 0),t([mt()],te.prototype,"entityId",void 0),t([mt()],te.prototype,"kind",void 0),t([mt()],te.prototype,"display",void 0),t([mt()],te.prototype,"label",void 0),t([mt({attribute:!1})],te.prototype,"options",void 0),t([mt({attribute:!1})],te.prototype,"order",void 0),te=t([ht("mt-climate-selector")],te);let ee=class extends ct{constructor(){super(...arguments),this.display="icons"}get _stateObj(){return this.hass?.states?.[this.entity]}_overrideMap(){const t=new Map;return(this.options??[]).forEach(e=>t.set(e.value,e)),t}_build(){const t=this._stateObj;if(!t)return[];const e=this._overrideMap();return It(t.attributes.options??[],this.order).filter(t=>!e.get(t)?.hide).map(i=>({value:i,label:e.get(i)?.label??Dt(i),icon:e.get(i)?.icon,active:i===t.state}))}_onSelect(t){this._stateObj&&this.hass.callService("input_select","select_option",{entity_id:this.entity,option:t.detail.value})}render(){const t=this._build();return t.length?V`<mt-selector-row
      .items=${t}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:W}};t([mt({attribute:!1})],ee.prototype,"hass",void 0),t([mt()],ee.prototype,"entity",void 0),t([mt()],ee.prototype,"display",void 0),t([mt()],ee.prototype,"label",void 0),t([mt({attribute:!1})],ee.prototype,"options",void 0),t([mt({attribute:!1})],ee.prototype,"order",void 0),ee=t([ht("mt-input-select")],ee);let ie=class extends ct{constructor(){super(...arguments),this.entities=[],this.display="icons"}_build(){return(this.entities??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon,active:"on"===e?.state,disabled:!e||"unavailable"===e.state}})}async _onSelect(t){const e=t.detail.value,i=(this.entities??[]).map(t=>t.entity).filter(t=>t&&t!==e&&"on"===this.hass.states[t]?.state);i.length&&await this.hass.callService("homeassistant","turn_off",{entity_id:i}),await this.hass.callService("homeassistant","turn_on",{entity_id:e})}render(){const t=this._build();return t.length?V`<mt-selector-row
      .items=${t}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:W}};t([mt({attribute:!1})],ie.prototype,"hass",void 0),t([mt({attribute:!1})],ie.prototype,"entities",void 0),t([mt()],ie.prototype,"display",void 0),t([mt()],ie.prototype,"label",void 0),ie=t([ht("mt-switch-group")],ie);let se=class extends ct{constructor(){super(...arguments),this.entities=[]}_build(){return(this.entities??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon??"mdi:toggle-switch-variant",active:"on"===e?.state,disabled:!e||"unavailable"===e.state}})}_onSelect(t){this.hass.callService("homeassistant","toggle",{entity_id:t.detail.value})}render(){const t=this._build();return t.length?V`<mt-selector-row
      .items=${t}
      display="icons"
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:W}};function oe(t,e,i){switch(i.split(".")[0]){case"button":e.callService("button","press",{entity_id:i});break;case"input_button":e.callService("input_button","press",{entity_id:i});break;case"scene":e.callService("scene","turn_on",{entity_id:i});break;case"script":e.callService("script","turn_on",{entity_id:i});break;case"switch":case"light":case"fan":case"input_boolean":e.callService("homeassistant","toggle",{entity_id:i});break;default:yt(t,"hass-more-info",{entityId:i})}}t([mt({attribute:!1})],se.prototype,"hass",void 0),t([mt({attribute:!1})],se.prototype,"entities",void 0),t([mt()],se.prototype,"label",void 0),se=t([ht("mt-switch-list")],se);let re=class extends ct{constructor(){super(...arguments),this.items=[]}_build(){return(this.items??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon??"mdi:gesture-tap-button",active:!1,disabled:!e||"unavailable"===e.state}})}_onSelect(t){oe(this,this.hass,t.detail.value)}render(){const t=this._build();return t.length?V`<mt-selector-row
      .items=${t}
      display="icons"
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:W}};t([mt({attribute:!1})],re.prototype,"hass",void 0),t([mt({attribute:!1})],re.prototype,"items",void 0),t([mt()],re.prototype,"label",void 0),re=t([ht("mt-button-list")],re);const ae={sensor:"mdi:gauge",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb",fan:"mdi:fan",button:"mdi:gesture-tap-button",input_button:"mdi:gesture-tap-button",scene:"mdi:palette",script:"mdi:script-text"};let ne=class extends ct{constructor(){super(...arguments),this.forceOff=!1,this._tap=()=>{this.config.entity&&function(t,e,i,s){const o=s??{action:"default"};switch(o.action){case"none":return;case"more-info":return void yt(t,"hass-more-info",{entityId:o.entity??i});case"toggle":return void e.callService("homeassistant","toggle",{entity_id:i});case"url":return void(o.url_path&&window.open(o.url_path));case"navigate":return void(o.navigation_path&&(window.history.pushState(null,"",o.navigation_path),yt(t,"location-changed",{replace:!1})));case"call-service":case"perform-action":{const t=o.perform_action??o.service;if(!t||!t.includes("."))return;const[i,s]=t.split(".");return void e.callService(i,s,o.data??o.service_data??{},o.target)}default:oe(t,e,i)}}(this,this.hass,this.config.entity,this.config.tap_action)}}get _stateObj(){return this.hass?.states?.[this.config.entity]}get _tileOn(){if(this.forceOff)return!1;const t=this._stateObj;return!!t&&!Tt(t.state)}_secondary(){const t=this._stateObj;if(!t)return;const e=this.config.entity.split(".")[0];if("sensor"===e){const e=t.attributes.unit_of_measurement;return e?`${t.state} ${e}`:t.state}return["switch","light","fan","input_boolean","binary_sensor"].includes(e)?"on"===t.state?"On":"Off":["button","input_button","scene","script"].includes(e)?void 0:t.state}render(){if(!this.config?.entity)return W;const t=this._stateObj,e=this.config.entity.split(".")[0],i=this.config.name??t?.attributes.friendly_name??this.config.entity,s=this.config.icon??t?.attributes.icon??ae[e]??"mdi:eye",o=this._secondary(),r=this._tileOn,a=this.config.width,n=1===a,l=this.config.compact||"number"==typeof a&&a<=2;return n?V`
        <button
          class=${jt({tile:!0,"icon-only":!0,on:r})}
          @click=${this._tap}
          aria-label=${i}
          title=${i}
        >
          <ha-icon icon=${s}></ha-icon>
        </button>
      `:l?V`
        <button
          class=${jt({tile:!0,compact:!0,on:r})}
          @click=${this._tap}
          aria-label=${i}
          title=${i}
        >
          <ha-icon icon=${s}></ha-icon>
        </button>
      `:V`
      <button class=${jt({tile:!0,on:r})} @click=${this._tap} aria-label=${i}>
        <div class="ic"><ha-icon icon=${s}></ha-icon></div>
        <div class="text">
          <div class="title">${i}</div>
          ${o?V`<div class="value">${o}</div>`:W}
        </div>
      </button>
    `}};ne.styles=[St,Yt,a`
      :host {
        display: block;
      }
      /* Icon-only (width 1): a single centered icon, like a mode chip. Always a
         full-round chip; muted when off, accent-colored (via .tile.on) when on. */
      .tile.icon-only {
        justify-content: center;
        gap: 0;
        padding: 0;
        min-height: 48px;
        height: 100%;
        border-radius: var(--mt-shape-full);
      }
      .tile.icon-only:not(.on) {
        color: var(--mt-on-surface-variant);
      }
      .tile.icon-only ha-icon {
        --mdc-icon-size: 24px;
      }
      /* Compact: just a bare centered icon (no circle chip), at the same height
         as the other tiles (inherits the shared .tile min-height). Width is left
         to the user's configured column span. Still follows the tile
         roundness/color rules via the shared .tile / .tile.on styles. */
      .tile.compact {
        justify-content: center;
      }
      .tile.compact ha-icon {
        --mdc-icon-size: 24px;
      }
    `],t([mt({attribute:!1})],ne.prototype,"hass",void 0),t([mt({attribute:!1})],ne.prototype,"config",void 0),t([mt({type:Boolean})],ne.prototype,"forceOff",void 0),ne=t([ht("mt-entity-tile")],ne);let le=class extends ct{constructor(){super(...arguments),this.items=[]}_value(t){const e=this.hass?.states?.[t.entity];if(!e||"unknown"===e.state||"unavailable"===e.state)return"—";const i=e.attributes.unit_of_measurement;return i?`${e.state} ${i}`:e.state}render(){const t=(this.items??[]).filter(t=>t.entity);return t.length?V`
      ${this.label?V`<div class="label">${this.label}</div>`:W}
      <div class="card">
        ${t.map(t=>{const e=this.hass?.states?.[t.entity],i=t.label??e?.attributes.friendly_name??t.entity;return V`<div class="row">
            ${t.icon?V`<ha-icon class="icon" icon=${t.icon}></ha-icon>`:W}
            <div class="title" title=${i}>${i}</div>
            <div class="val">${this._value(t)}</div>
          </div>`})}
      </div>
    `:W}};le.styles=[St,a`
      :host {
        display: block;
      }
      .label {
        color: var(--mt-on-surface-variant);
        font-size: var(--md-sys-typescale-label-large-size, 13px);
        font-weight: 500;
        padding: 0 4px 6px;
      }
      /* One container for all sensors (à la Google Home), large M3 radius. */
      .card {
        background: var(--mt-surface-container);
        border-radius: var(--mt-shape-card);
        padding: 6px 0;
        overflow: hidden;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
      }
      .icon {
        flex: 0 0 auto;
        /* same height as the text, no circle/padding/outline */
        --mdc-icon-size: 18px;
        color: var(--mt-on-surface-variant);
        display: inline-flex;
        align-items: center;
      }
      .title {
        flex: 1;
        min-width: 0;
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        font-weight: 400;
        color: var(--mt-on-surface-variant);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .val {
        flex: 0 0 auto;
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        font-weight: 700;
        color: var(--mt-on-surface);
        white-space: nowrap;
      }
    `],t([mt({attribute:!1})],le.prototype,"hass",void 0),t([mt({attribute:!1})],le.prototype,"items",void 0),t([mt()],le.prototype,"label",void 0),le=t([ht("mt-sensor-list")],le);const ce=new Set(["off","unavailable","unknown",""]);function de(t,e,i){const s=[];for(const o of t){if(o.t<e)continue;const t=parseFloat(o.state);isFinite(t)&&s.push({t:(o.t-i)/6e4,v:t})}return s}function he(t,e,i={}){const s=i.tr??t,o=i.vel??.1,r=i.met??1.1,a=i.clo??.6,n=e/100*Rt(t),l=.155*a,c=58.15*r,d=c,h=l<=.078?1+1.29*l:1.05+.645*l,p=12.1*Math.sqrt(o),u=t+273,m=s+273,f=l*h,v=3.96*f,g=100*f,_=f*u,b=308.7-.028*d+v*(m/100)**4;let y=(u+(35.5-t)/(3.5*l+.1))/100,w=y,x=p;for(let t=0;t<150;t++){w=(w+y)/2;const t=2.38*Math.abs(100*w-u)**.25;if(x=p>t?p:t,y=(b+_*x-v*w**4)/(100+g*x),Math.abs(y-w)<=15e-5)break}const $=3.05*.001*(5733-6.99*d-n),A=d>58.15?.42*(d-58.15):0,k=17e-6*c*(5867-n),L=.0014*c*(34-t),M=3.96*h*(y**4-(m/100)**4),C=h*x*(100*y-273-t);return(.303*Math.exp(-.036*c)+.028)*(d-$-A-k-L-M-C)}function pe(t){return Math.max(.5,Math.min(1,.95-.075*(t-21)))}function ue(t){if(t.length<4)return null;const e=[...t].sort((t,e)=>t.t-e.t),i=e[0].t,s=e[0].v;if(e[e.length-1].t-i<6)return null;let o=0,r=i,a=s,n=0,l=0,c=0,d=0,h=0;const p=[];for(const t of e){o+=(t.v+a)/2*(t.t-r),r=t.t,a=t.v;const e=o,u=t.t-i,m=t.v-s;p.push({x1:e,x2:u,y:m}),n+=e*e,l+=e*u,c+=u*u,d+=e*m,h+=u*m}const u=n*c-l*l;if(Math.abs(u)<1e-12)return null;const m=(d*c-h*l)/u,f=(n*h-l*d)/u,v=-m;if(!(v>1e-6))return null;const g=f/v;let _=0,b=0;const y=p.reduce((t,e)=>t+e.y,0)/p.length;for(const t of p){const e=m*t.x1+f*t.x2;_+=(t.y-e)**2,b+=(t.y-y)**2}const w=1-_/b;return w<.5?null:{k:v,asymptote:g,r2:w}}function me(t,e,i){const{k:s,asymptote:o}=i;return function(t,e,i){return t<i?e>t&&e<i:t>i&&e<t&&e>i}(t,e,o)?Math.log((t-o)/(e-o))/s:null}function fe(t){if(!isFinite(t)||t<0)return"";const e=Math.round(t);return e<60?`${Math.max(1,e)}m`:e<120?"1h":"2hr+"}const ve={visible:!1,comfortable:!1};const ge=new Set(["unavailable","unknown",""]),_e={comfortable:"mdi:emoticon-happy-outline",warm:"mdi:thermometer-high",cool:"mdi:thermometer-low",humid:"mdi:water-percent"},be={comfortable:"heat_cool",warm:"heat",cool:"cool",humid:"cool"};let ye=class extends ct{constructor(){super(...arguments),this._result={visible:!1,comfortable:!1},this._fetching=!1,this._lastFetchMs=0}connectedCallback(){super.connectedCallback(),this._timer=window.setInterval(()=>{this._tick()},3e4)}async _tick(){this._recompute(),Date.now()-this._lastFetchMs>=6e4&&await this._refresh()}disconnectedCallback(){super.disconnectedCallback(),this._timer&&window.clearInterval(this._timer),this._timer=void 0}updated(t){t.has("entityId")||t.has("tempSensor")||t.has("humiditySensor")||t.has("feature")?this._refresh():t.has("hass")&&this._recompute()}get _climate(){return this.hass?.states?.[this.entityId]}_tempNow(){const t=parseFloat(String(this.hass?.states?.[this.tempSensor]?.state));return isFinite(t)?t:Number(this._climate?.attributes?.current_temperature)}_rhNow(){return parseFloat(String(this.hass?.states?.[this.humiditySensor]?.state))}_staleMin(){const t=this.hass?.states?.[this.tempSensor]?.last_changed,e=t?new Date(t).getTime():NaN;return isFinite(e)?Math.max(0,(Date.now()-e)/6e4):0}_target(t){const e=this._climate,i=e.attributes;if("heat_cool"===e.state&&null!=i.target_temp_low&&null!=i.target_temp_high)return t<i.target_temp_low?Number(i.target_temp_low):t>i.target_temp_high?Number(i.target_temp_high):null;const s=Number(i.temperature);return isFinite(s)?"cool"===e.state&&t<=s||"heat"===e.state&&t>=s?null:s:null}_hasReadings(){const t=this._climate;return!!(this.hass&&t&&!ge.has(t.state)&&this.tempSensor&&this.humiditySensor&&isFinite(this._tempNow())&&isFinite(this._rhNow()))}_isRunning(){const t=this._climate;return!(!t||ce.has(t.state))}_recompute(){if(!this._hasReadings())return void this._set({visible:!1,comfortable:!1});const t=this._tempNow(),e=this._isRunning();this._set(function(t){if(!isFinite(t.tempNow)||!isFinite(t.rhNow))return ve;const e=he(t.tempNow,t.rhNow,{clo:pe(t.tempNow)}),i=Nt(t.tempNow,t.rhNow),s=e>.5,o=e<-.5;if(!(s||o||i>.012)){const e=t.running?function(t){if(!t.showTargetEta||null==t.target)return;if(Math.abs(t.tempNow-t.target)<.25)return;const e=ue(t.tempSeries);if(!e)return;const i=t.target<t.tempNow,s=me(t.tempNow,t.target,e);if(null!=s){const e=s-t.staleMin;return e<1.5?`Almost at ${t.target}${t.unit}`:`${fe(e)} until ${i?"cooled":"heated"} to ${t.target}${t.unit}`}return(t.target-t.tempNow)*(e.asymptote-t.tempNow)>0&&!(Math.abs(e.asymptote-t.target)<=.5)?`won't go ${i?"below":"above"} ${Math.round(e.asymptote)}${t.unit}`:void 0}(t):void 0;return{visible:!0,comfortable:!0,line:e??"Room feels comfortable",status:"comfortable"}}const r=function(t,e){const i=[];let s,o=0;for(const r of t){for(;o<e.length&&e[o].t<=r.t;)s=e[o].v,o++;void 0!==s&&i.push({t:r.t,l:r.v,r:s})}return i}(t.tempSeries,t.rhSeries);let a,n,l,c;s?(a=r.map(t=>({t:t.t,v:he(t.l,t.r,{clo:pe(t.l)})})),n=e,l=.5,c="warm"):o?(a=r.map(t=>({t:t.t,v:he(t.l,t.r,{clo:pe(t.l)})})),n=e,l=-.5,c="cool"):(a=r.map(t=>({t:t.t,v:Nt(t.l,t.r)})),n=i,l=.012,c="humid");const d=`Room feels ${c}`,h=a.length?a[a.length-1].t-a[0].t:0;if(!t.running||a.length<2||h<6)return{visible:!0,comfortable:!1,line:d,status:c};const p=ue(a),u=(p?me(n,l,p):null)??function(t,e){const i=function(t){const e=t.length;if(e<2)return null;let i=0,s=0,o=0,r=0,a=0;for(const e of t)i+=e.t,s+=e.v,o+=e.t*e.t,r+=e.t*e.v,a+=e.v*e.v;const n=e*o-i*i;if(0===n)return null;const l=e*r-i*s,c=l/n,d=e*a-s*s;return{slope:c,intercept:(s-c*i)/e,n:e,r2:0===d?1:l*l/(n*d)}}(t);if(!i||0===i.slope)return null;const s=t[t.length-1],o=(e-i.intercept)/i.slope-s.t;return!(o>0)||o>720?null:o}(a,l);let m=d;if(null!=u){const e=u-t.staleMin;m=e<1.5?"Room should be comfortable soon":`${fe(e)} until comfortable`}return{visible:!0,comfortable:!1,line:m,status:c}}({tempNow:t,rhNow:this._rhNow(),tempSeries:e?this._cache?.tempSeries??[]:[],rhSeries:e?this._cache?.rhSeries??[]:[],target:e?this._target(t):null,showTargetEta:e&&(this.feature.show_target_eta??!1),running:e,staleMin:this._staleMin(),unit:this.hass.config?.unit_system?.temperature??"°C"}))}_sessionStartMs(){const t=this._climate?.last_changed;if(!t)return null;const e=new Date(t).getTime();return isFinite(e)?e:null}async _refresh(){if(this._recompute(),!this._fetching&&this._hasReadings()&&this._isRunning()){this._fetching=!0,this._lastFetchMs=Date.now();try{const t=Date.now(),e=Math.max(this._sessionStartMs()??0,t-864e5),i=[this.tempSensor,this.humiditySensor],s=await async function(t,e,i,s){const o=await t.callWS({type:"history/history_during_period",start_time:new Date(i).toISOString(),end_time:new Date(s).toISOString(),entity_ids:e,minimal_response:!0,no_attributes:!0}),r={};for(const t of e){const e=Array.isArray(o?.[t])?o[t]:[];r[t]=e.map(t=>{const e=t.lu??t.lc??t.last_updated??t.last_changed??0;return{state:String(t.s??t.state??""),t:1e3*Number(e)}}).filter(t=>t.t>0).sort((t,e)=>t.t-e.t)}return r}(this.hass,i,e,t);this._cache={tempSeries:de(s[this.tempSensor],e,e),rhSeries:de(s[this.humiditySensor],e,e)},this._recompute()}catch{}finally{this._fetching=!1}}}_set(t){this._result=t,this.dispatchEvent(new CustomEvent("feature-visibility",{detail:{visible:t.visible},bubbles:!0,composed:!0}))}render(){const t=this._result;if(!t.visible||!t.line)return W;const e=t.status;return V`<div class="comfort" role="status">
      <ha-icon
        icon=${_e[e]}
        style=${`color:${Ot(be[e])}`}
      ></ha-icon>
      <span>${t.line}</span>
    </div>`}};ye.styles=[St,a`
      :host {
        display: block;
      }
      .comfort {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 12px;
        color: var(--mt-on-surface-variant);
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        line-height: 1.3;
        text-align: center;
      }
      .comfort ha-icon {
        flex: 0 0 auto;
        --mdc-icon-size: 18px;
        /* colour is set inline per comfort state (see render) */
      }
    `],t([mt({attribute:!1})],ye.prototype,"hass",void 0),t([mt()],ye.prototype,"entityId",void 0),t([mt({attribute:!1})],ye.prototype,"feature",void 0),t([mt({attribute:!1})],ye.prototype,"tempSensor",void 0),t([mt({attribute:!1})],ye.prototype,"humiditySensor",void 0),t([ft()],ye.prototype,"_result",void 0),ye=t([ht("mt-comfort")],ye);let we=class extends ct{constructor(){super(...arguments),this.span=10,this._comfortVisible=!1,this._onComfortVisibility=t=>{this._comfortVisible=!!t.detail.visible}}get _climateOff(){return"off"===this.hass?.states?.[this.entityId]?.state}willUpdate(t){t.has("span")&&(this.style.gridColumn=`span ${Math.max(1,this.span)}`),this.toggleAttribute("hidden","comfort"===this.feature?.type&&!this._comfortVisible)}render(){const t=this.feature;switch(t.type){case"climate-hvac-modes":case"climate-fan-modes":case"climate-swing-modes":case"climate-preset-modes":{const e="climate-hvac-modes"===t.type?"hvac":"climate-fan-modes"===t.type?"fan":"climate-preset-modes"===t.type?"preset":"swing";return V`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind=${e}
          display=${t.display??"icons"}
          .label=${t.label}
          .options=${t.options}
          .order=${t.order}
        ></mt-climate-selector>`}case"input-select":return V`<mt-input-select
          .hass=${this.hass}
          entity=${t.entity}
          display=${t.display??"icons"}
          .label=${t.label}
          .options=${t.options}
          .order=${t.order}
        ></mt-input-select>`;case"switch-group":return V`<mt-switch-group
          .hass=${this.hass}
          .entities=${t.entities}
          display=${t.display??"icons"}
          .label=${t.label}
        ></mt-switch-group>`;case"switch-list":return V`<mt-switch-list
          .hass=${this.hass}
          .entities=${t.entities}
          .label=${t.label}
        ></mt-switch-list>`;case"button-list":return V`<mt-button-list
          .hass=${this.hass}
          .items=${t.items}
          .label=${t.label}
        ></mt-button-list>`;case"entity-tile":return V`<mt-entity-tile
          .hass=${this.hass}
          .config=${t}
          .forceOff=${this._climateOff}
        ></mt-entity-tile>`;case"sensor-list":return V`<mt-sensor-list
          .hass=${this.hass}
          .items=${t.items}
          .label=${t.label}
        ></mt-sensor-list>`;case"comfort":return V`<mt-comfort
          .hass=${this.hass}
          entityId=${this.entityId}
          .feature=${t}
          .tempSensor=${this.feelsLikeTemp}
          .humiditySensor=${this.feelsLikeHumidity}
          @feature-visibility=${this._onComfortVisibility}
        ></mt-comfort>`;default:return W}}};we.styles=a`
    :host {
      display: block;
      /* allow shrinking below content so a wide icon list wraps/scrolls inside
         its column instead of overflowing the card */
      min-width: 0;
    }
    :host([hidden]) {
      display: none;
    }
  `,t([mt({attribute:!1})],we.prototype,"hass",void 0),t([mt()],we.prototype,"entityId",void 0),t([mt({attribute:!1})],we.prototype,"feature",void 0),t([mt({type:Number})],we.prototype,"span",void 0),t([mt({attribute:!1})],we.prototype,"feelsLikeTemp",void 0),t([mt({attribute:!1})],we.prototype,"feelsLikeHumidity",void 0),t([ft()],we.prototype,"_comfortVisible",void 0),we=t([ht("mt-feature-row")],we),function(){const t=window;t.customIcons=t.customIcons||{},t.customIcons.mt||(t.customIcons.mt={getIcon:async t=>{const e=Ft[t];if(!e)throw new Error(`Unknown mt icon: mt:${t}`);return e.secondary?{path:e.path,secondaryPath:e.secondary}:{path:e.path}},getIconList:async()=>Object.keys(Ft).map(t=>({name:t,keywords:["ac","swing","vane","louver","climate","airflow",...t.split("-")]}))})}(),console.info("%c MATERIAL-THERMOSTAT-CARD %c v1.6.8 ","color: white; background: #6750a4; font-weight: 700;","color: #6750a4; background: white; font-weight: 700;"),window.customCards=window.customCards||[],window.customCards.push({type:Lt,name:"Material Thermostat Card",description:"A Material 3 Expressive thermostat card with customizable selectors and Nest/Google Home inspired UI.",preview:!0,documentationURL:"https://github.com/lageorgem/ha-material-thermostat-card",getEntitySuggestion:(t,e)=>"climate"===e.split(".")[0]?{config:{type:`custom:${Lt}`,entity:e}}:null});let xe=class extends ct{constructor(){super(...arguments),this._widthPx=0}static async getConfigElement(){return await Promise.resolve().then(function(){return Ye}),document.createElement(Mt)}static getStubConfig(t){const e=Object.keys(t.states).find(t=>t.startsWith("climate."))??"";return{type:`custom:${Lt}`,entity:e,features:[{type:"climate-hvac-modes"}]}}setConfig(t){if(!t.entity||"climate"!==t.entity.split(".")[0])throw new Error("You must specify a climate entity.");this._config=t}getCardSize(){return 7+(this._config?.features?.length??0)}get _stateObj(){return this.hass?.states?.[this._config?.entity]}_trackedEntityIds(){const t=new Set([this._config.entity]),e=this._config.feels_like;e?.temperature&&t.add(e.temperature),e?.humidity&&t.add(e.humidity);for(const e of this._config.features??[])"entity"in e&&e.entity&&t.add(e.entity),"entities"in e&&e.entities?.forEach(e=>t.add(e.entity)),"items"in e&&e.items?.forEach(e=>t.add(e.entity));return[...t]}_displayCurrent(t){const e=this._config.feels_like;if(!e?.show_as_current||!e.temperature||!e.humidity)return t;const i=parseFloat(String(this.hass?.states?.[e.temperature]?.state)),s=parseFloat(String(this.hass?.states?.[e.humidity]?.state));return isFinite(i)&&isFinite(s)?function(t,e){return function(t,e){const i=function(t){return 9*t/5+32}(t),s=Math.max(0,Math.min(100,e)),o=.5*(i+61+1.2*(i-68)+.094*s);if((o+i)/2<80)return Ht(o);let r=2.04901523*i-42.379+10.14333127*s-.22475541*i*s-.00683783*i*i-.05481717*s*s+.00122874*i*i*s+85282e-8*i*s*s-199e-8*i*i*s*s;return s<13&&i>=80&&i<=112?r-=(13-s)/4*Math.sqrt((17-Math.abs(i-95))/17):s>85&&i>=80&&i<=87&&(r+=(s-85)/10*((87-i)/5)),Ht(r)}(t,e)}(i,s):t}shouldUpdate(t){if(t.has("_config")||t.has("_selectedTemp")||t.has("_selectedLow")||t.has("_selectedHigh")||t.has("_widthPx"))return!0;if(!this._config)return!1;if(t.has("hass")){const e=t.get("hass");return!e||this._trackedEntityIds().some(t=>e.states[t]!==this.hass.states[t])}return!1}updated(t){if(t.has("hass")||t.has("_config")){const e=t.get("hass");!this._config?.theme||e&&e.themes===this.hass.themes&&!t.has("_config")||function(t,e,i,s){void 0===s&&(s=!1),t._themes||(t._themes={});var o=e.default_theme;("default"===i||i&&e.themes[i])&&(o=i);var r=bt({},t._themes);if("default"!==o){var a=e.themes[o];Object.keys(a).forEach(function(e){var i="--"+e;t._themes[i]="",r[i]=a[e]})}if(t.updateStyles?t.updateStyles(r):window.ShadyCSS&&window.ShadyCSS.styleSubtree(t,r),s){var n=document.querySelector("meta[name=theme-color]");if(n){n.hasAttribute("default-content")||n.setAttribute("default-content",n.getAttribute("content"));var l=r["--primary-color"]||n.getAttribute("default-content");n.setAttribute("content",l)}}}(this,this.hass.themes,this._config.theme)}if(t.has("hass")){const t=this._stateObj?.attributes;null!=this._selectedTemp&&t?.temperature===this._selectedTemp&&(this._selectedTemp=void 0),null!=this._selectedLow&&t?.target_temp_low===this._selectedLow&&(this._selectedLow=void 0),null!=this._selectedHigh&&t?.target_temp_high===this._selectedHigh&&(this._selectedHigh=void 0)}}_observeWidth(){this._resizeObserver||"undefined"==typeof ResizeObserver||(this._resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect.width??0,i=Math.max(0,e-32);Math.abs(i-this._widthPx)>=1&&(this._widthPx=i)}),this._resizeObserver.observe(this))}connectedCallback(){super.connectedCallback(),this._observeWidth()}_featureWidthPct(t){return"width"in t&&"number"==typeof t.width&&t.width>0?Math.max(10,Math.min(Ct,10*Math.round(t.width/10))):"entity-tile"===t.type?50:Ct}_featureSpan(t){return e=this._featureWidthPct(t),Math.max(1,Math.min(10,Math.round(e/10)));var e}_layout(){const t=this._config.features??[],e=this._widthPx,i=t.length?Math.max(...t.map(t=>this._featureWidthPct(t))):100,s=e*(100-i)/100;if(!(t.length>0&&i<100&&e>=560&&s>=240)){const t=Math.min(e,320);return{wide:!1,dialStyle:{marginBottom:`-${Math.round(.147*t)}px`},featureStyle:{},gridCols:10}}return{wide:!0,dialStyle:{flex:"1 1 auto"},featureStyle:{flex:`0 0 ${i}%`},gridCols:Math.max(1,i/10)}}get _isDual(){const t=this._stateObj?.attributes;return"heat_cool"===this._stateObj?.state&&null!=t?.target_temp_low&&null!=t?.target_temp_high}get _targetTemp(){return this._selectedTemp??this._stateObj?.attributes.temperature}get _targetLow(){return this._selectedLow??this._stateObj?.attributes.target_temp_low}get _targetHigh(){return this._selectedHigh??this._stateObj?.attributes.target_temp_high}_scheduleCommit(){this._debounceTimer&&window.clearTimeout(this._debounceTimer),this._debounceTimer=window.setTimeout(()=>{const t={entity_id:this._config.entity};this._isDual?(t.target_temp_low=this._targetLow,t.target_temp_high=this._targetHigh):t.temperature=this._targetTemp,this.hass.callService("climate","set_temperature",t)},600)}_onChanging(t){const{value:e,low:i,high:s}=t.detail;null!=i||null!=s?(this._selectedLow=i,this._selectedHigh=s):this._selectedTemp=e}_onChanged(t){this._onChanging(t),this._scheduleCommit()}_showMoreInfo(){yt(this,"hass-more-info",{entityId:this._config.entity})}_presetIcon(){const t=this._config.features?.find(t=>"climate-preset-modes"===t.type);if(!t)return;const e=this._stateObj?.attributes.preset_mode;if(!e||"none"===e||"off"===e)return;const i=t.options?.find(t=>t.value===e);return void 0!==i?.icon?i.icon||void 0:Pt(e)}_colorMode(){const t=this._stateObj?.attributes;switch(t?.hvac_action){case"cooling":return"cool";case"heating":return"heat";case"drying":return"dry";case"fan":return"fan_only";default:return this._stateObj?.state??"off"}}render(){if(!this._config||!this.hass)return V``;const t=this._stateObj;if(!t)return V`<ha-card
        ><div class="error">Entity not found: ${this._config.entity}</div></ha-card
      >`;const e=t.attributes,i=this._config.name??e.friendly_name??this._config.entity,s="unavailable"===t.state||"unknown"===t.state,o=this.hass.config?.unit_system?.temperature??"°C",r=this._colorMode(),a=this._layout();return V`
      <ha-card style=${`--mt-active-color: ${Ot(r)}`}>
        <div class="header">
          <div class="name" title=${i}>${i}</div>
          <button class="more" aria-label="More information" @click=${this._showMoreInfo}>
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </button>
        </div>

        <div class=${"body "+(a.wide?"wide":"stacked")}>
          <div class="dial-wrap" style=${kt(a.dialStyle)}>
            <mt-circular-dial
              .value=${this._targetTemp??e.min_temp??20}
              .min=${e.min_temp??7}
              .max=${e.max_temp??35}
              .step=${e.target_temp_step??.5}
              .current=${this._displayCurrent(e.current_temperature)}
              .mode=${r}
              .modeLabel=${s?"Unavailable":Dt(t.state)}
              .presetIcon=${this._presetIcon()}
              .unit=${o}
              .dual=${this._isDual}
              .lowValue=${this._targetLow}
              .highValue=${this._targetHigh}
              .showCurrentAsPrimary=${this._config.show_current_as_primary??!1}
              .disabled=${s}
              @value-changing=${this._onChanging}
              @value-changed=${this._onChanged}
            ></mt-circular-dial>
          </div>

          ${this._config.features?.length?V`<div
                class="features"
                style=${kt({...a.featureStyle,gridTemplateColumns:`repeat(${a.gridCols}, minmax(0, 1fr))`})}
              >
                ${this._config.features.map(t=>V`<mt-feature-row
                    .hass=${this.hass}
                    .entityId=${this._config.entity}
                    .feature=${t}
                    .span=${this._featureSpan(t)}
                    .feelsLikeTemp=${this._config.feels_like?.temperature}
                    .feelsLikeHumidity=${this._config.feels_like?.humidity}
                  ></mt-feature-row>`)}
              </div>`:W}
        </div>
      </ha-card>
    `}disconnectedCallback(){super.disconnectedCallback(),this._debounceTimer&&window.clearTimeout(this._debounceTimer),this._resizeObserver?.disconnect(),this._resizeObserver=void 0}};xe.styles=[St,a`
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
    `],t([mt({attribute:!1})],xe.prototype,"hass",void 0),t([ft()],xe.prototype,"_config",void 0),t([ft()],xe.prototype,"_selectedTemp",void 0),t([ft()],xe.prototype,"_selectedLow",void 0),t([ft()],xe.prototype,"_selectedHigh",void 0),t([ft()],xe.prototype,"_widthPx",void 0),xe=t([ht(Lt)],xe);let $e=class extends ct{constructor(){super(...arguments),this.value="icons"}_set(t){t!==this.value&&this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t},bubbles:!0,composed:!0}))}render(){return V`
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
        <button class=${"tile"===this.value?"on":""} @click=${()=>this._set("tile")}>
          <ha-icon icon="mdi:card-text-outline"></ha-icon><span>Tile</span>
        </button>
      </div>
    `}};$e.styles=a`
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
  `,t([mt()],$e.prototype,"value",void 0),$e=t([ht("mt-display-toggle")],$e);const Ae=new Set(["ArrowRight","ArrowUp","ArrowLeft","ArrowDown","PageUp","PageDown","Home","End"]);let ke=class extends ct{constructor(){super(...arguments),this.disabled=!1,this.step=1,this.min=1,this.max=4,this.tooltipMode="interaction",this._pressed=!1,this._tooltipVisible=!1,this._onPointerDown=t=>{this.disabled||(t.preventDefault(),this._slider.setPointerCapture(t.pointerId),this._pressed=!0,this._tooltipVisible=!0,this.value=this._range*this._pctFromX(t.clientX))},this._onPointerMove=t=>{this._pressed&&!this.disabled&&(this.value=this._range*this._pctFromX(t.clientX),this._emit("slider-moved",this._stepped(this._bounded(this.value))))},this._onPointerUp=t=>{this._pressed&&(this._slider.releasePointerCapture(t.pointerId),this._pressed=!1,this._tooltipVisible=!1,this.value=this._stepped(this._bounded(this._range*this._pctFromX(t.clientX))),this._emit("value-changed",this.value))},this._onKeyDown=t=>{if(this.disabled||!Ae.has(t.key))return;t.preventDefault();const e=this.value??this.min;switch(t.key){case"ArrowRight":case"ArrowUp":this.value=this._bounded(e+this.step);break;case"ArrowLeft":case"ArrowDown":this.value=this._bounded(e-this.step);break;case"PageUp":this.value=this._stepped(this._bounded(e+this._bigStep));break;case"PageDown":this.value=this._stepped(this._bounded(e-this._bigStep));break;case"Home":this.value=this.min;break;case"End":this.value=this.max}this._emit("value-changed",this.value)}}get _range(){return this.range??this.max}_bounded(t){return Math.min(Math.max(t,this.min),this.max)}_stepped(t){return Math.round(t/this.step)*this.step}_valueToPct(t){return this._bounded(t)/this._range}_pctFromX(t){const e=this._slider.getBoundingClientRect();return Math.max(0,Math.min(1,(t-e.left)/e.width))}updated(t){if(t.has("value")){const t=this._stepped(this.value??0).toString();this.setAttribute("aria-valuenow",t),this.setAttribute("aria-valuetext",t)}t.has("min")&&this.setAttribute("aria-valuemin",this.min.toString()),t.has("max")&&this.setAttribute("aria-valuemax",this.max.toString())}connectedCallback(){super.connectedCallback(),this.setAttribute("role","slider"),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"),this.setAttribute("aria-orientation","horizontal"),this.addEventListener("keydown",this._onKeyDown)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("keydown",this._onKeyDown)}get _bigStep(){return Math.max(this.step,(this.max-this.min)/10)}_emit(t,e){this.dispatchEvent(new CustomEvent(t,{detail:{value:e},bubbles:!0,composed:!0}))}_renderTooltip(){if("never"===this.tooltipMode)return W;const t="always"===this.tooltipMode||this._tooltipVisible&&"interaction"===this.tooltipMode,e=this._bounded(this._stepped(this.value??0));return V`<span aria-hidden="true" class=${jt({tooltip:!0,visible:t})}
      >${e}</span
    >`}render(){const t=Math.round(this._range/this.step);return V`
      <div class=${jt({container:!0,pressed:this._pressed})}
        style=${kt({"--value":`${this._valueToPct(this.value??0)}`})}>
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
              style=${kt({"--min":""+this.min/this._range,"--max":""+(1-this.max/this._range)})}
            ></div>
          </div>
          ${Array(t).fill(0).map((e,i)=>0===i?W:V`<div class="dot" style=${kt({"--value":""+i/t})}></div>`)}
          ${void 0!==this.value?V`<div class="handle"></div>`:W}
          ${this._renderTooltip()}
        </div>
      </div>
    `}};ke.styles=a`
    :host {
      display: block;
      height: 36px;
      width: 100%;
      outline: none;
    }
    /* Keyboard focus: a soft ring on the handle only — NOT a box around the whole
       control, which read as a stray colored band over the editor background. */
    :host(:focus-visible) .handle::after {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 45%, transparent);
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
    /* The unfilled track is transparent so it reads as the surrounding surface
       (the editor's feature panel) rather than a stray tinted band. */
    .background {
      position: absolute;
      inset: 0;
      background: transparent;
    }
    .active {
      position: absolute;
      background: var(--primary-color, #6750a4);
      border-radius: var(--ha-border-radius-md, 8px);
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
  `,t([mt({type:Boolean,reflect:!0})],ke.prototype,"disabled",void 0),t([mt({type:Number})],ke.prototype,"value",void 0),t([mt({type:Number})],ke.prototype,"step",void 0),t([mt({type:Number})],ke.prototype,"min",void 0),t([mt({type:Number})],ke.prototype,"max",void 0),t([mt({type:Number})],ke.prototype,"range",void 0),t([mt({attribute:"tooltip-mode"})],ke.prototype,"tooltipMode",void 0),t([ft()],ke.prototype,"_pressed",void 0),t([ft()],ke.prototype,"_tooltipVisible",void 0),t([vt("#slider")],ke.prototype,"_slider",void 0),ke=t([ht("mt-grid-slider")],ke);let Le=class extends ct{constructor(){super(...arguments),this.default=Ct}_emit(t){this.dispatchEvent(new CustomEvent("width-changed",{detail:{value:t},bubbles:!0,composed:!0}))}_onChanged(t){const e=t.detail?.value;this._emit("number"==typeof e?e:void 0)}_reset(){null!=this.value&&this._emit(void 0)}render(){const t=null!=this.value,e=this.value??this.default;return V`
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
      ${t?W:V`<div class="hint">
            Default — ${this.default===Ct?"full width":`${this.default}%`}.
          </div>`}
    `}};Le.styles=a`
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
  `,t([mt({attribute:!1})],Le.prototype,"hass",void 0),t([mt({type:Number})],Le.prototype,"value",void 0),t([mt({type:Number})],Le.prototype,"default",void 0),Le=t([ht("mt-width-field")],Le);let Me=class extends ct{constructor(){super(...arguments),this.items=[],this.value="",this.placeholder="Search…",this.allowCustom=!1,this.customPrefix="",this._query=""}firstUpdated(){this._searchInput?.focus()}_filtered(){const t=this._query.trim().toLowerCase();return t?this.items.filter(e=>e.value.toLowerCase().includes(t)||e.primary.toLowerCase().includes(t)||(e.secondary?.toLowerCase().includes(t)??!1)||(e.keywords?.some(e=>e.toLowerCase().includes(t))??!1)).slice(0,50):this.items.slice(0,50)}_customValue(){const t=this._query.trim();return this.customPrefix&&!t.includes(":")?this.customPrefix+t:t}_pick(t){this.dispatchEvent(new CustomEvent("pick",{detail:{value:t},bubbles:!0,composed:!0}))}_onKey(t){"Escape"===t.key?(t.stopPropagation(),this.dispatchEvent(new CustomEvent("dismiss",{bubbles:!0,composed:!0}))):"Enter"===t.key&&this.allowCustom&&this._query.trim()&&this._pick(this._customValue())}render(){const t=this._filtered(),e=this._customValue(),i=this.allowCustom&&this._query.trim().length>0&&!t.some(t=>t.value===e);return V`
      <input
        class="search"
        type="text"
        placeholder=${this.placeholder}
        .value=${this._query}
        @input=${t=>this._query=t.target.value}
        @keydown=${this._onKey}
      />
      <div class="results" role="listbox">
        ${t.map(t=>V`<button
            type="button"
            class=${jt({opt:!0,active:t.value===this.value})}
            role="option"
            @click=${()=>this._pick(t.value)}
          >
            ${t.icon?V`<ha-icon icon=${t.icon}></ha-icon>`:W}
            <span class="opt-text">
              <span class="opt-name">${t.primary}</span>
              ${t.secondary?V`<span class="opt-sub">${t.secondary}</span>`:W}
            </span>
          </button>`)}
        ${i?V`<button type="button" class="opt custom" @click=${()=>this._pick(e)}>
              <ha-icon icon=${this.customPrefix?e:"mdi:plus"}></ha-icon>
              <span class="opt-text"><span class="opt-name">Use “${e}”</span></span>
            </button>`:W}
        ${0!==t.length||i?W:V`<div class="empty">No matches</div>`}
      </div>
    `}};Me.styles=a`
    :host {
      display: block;
    }
    .search {
      width: 100%;
      box-sizing: border-box;
      height: 38px;
      padding: 0 12px;
      margin-bottom: 6px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      background: var(--md-sys-color-surface-container, var(--card-background-color));
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      font: inherit;
      font-size: 14px;
      outline: none;
    }
    .search:focus {
      border-color: var(--md-sys-color-primary, var(--primary-color));
    }
    .results {
      max-height: 240px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .opt {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 10px;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      border-radius: 10px;
      cursor: pointer;
      font: inherit;
      text-align: left;
    }
    .opt:hover {
      background: color-mix(in srgb, currentColor 8%, transparent);
    }
    .opt.active {
      background: var(--md-sys-color-secondary-container, rgba(127, 127, 127, 0.18));
    }
    .opt ha-icon {
      --mdc-icon-size: 20px;
      flex: 0 0 auto;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    .opt-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .opt-name {
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .opt-sub {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .empty {
      padding: 10px;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      font-size: 13px;
      text-align: center;
    }
  `,t([mt({attribute:!1})],Me.prototype,"items",void 0),t([mt()],Me.prototype,"value",void 0),t([mt()],Me.prototype,"placeholder",void 0),t([mt({type:Boolean})],Me.prototype,"allowCustom",void 0),t([mt()],Me.prototype,"customPrefix",void 0),t([ft()],Me.prototype,"_query",void 0),t([vt(".search")],Me.prototype,"_searchInput",void 0),Me=t([ht("mt-search-panel")],Me);const Ce=["thermostat","thermostat-auto","thermometer","snowflake","snowflake-variant","sun-snowflake-variant","fire","water-percent","air-conditioner","air-filter","air-humidifier","air-purifier","heat-pump","radiator","radiator-disabled","fan","fan-auto","fan-off","fan-speed-1","fan-speed-2","fan-speed-3","fan-chevron-up","fan-chevron-down","leaf","sofa","sofa-outline","bed","sleep","power-sleep","home","home-outline","home-thermometer","home-automation","home-export-outline","run-fast","rocket-launch","cancel","snowman","sun-thermometer","snowflake-thermometer","coolant-temperature","weather-sunny","weather-night","weather-cloudy","weather-partly-cloudy","weather-rainy","weather-pouring","weather-snowy","weather-windy","weather-fog","weather-lightning","weather-hail","weather-sunset","white-balance-sunny","umbrella","power","flash","lightning-bolt","battery","solar-power","transmission-tower","ev-station","gauge","speedometer","meter-electric","lightbulb","lightbulb-group","ceiling-light","floor-lamp","lamp","led-strip","brightness-5","brightness-6","palette","door","door-open","garage","garage-variant","gate","window-closed","window-open","blinds","curtains","fence","television","speaker","music","volume-high","play","pause","stop","motion-sensor","smoke-detector","fire-alert","water","water-alert","valve","pump","eye","eye-off","lock","lock-open","bell","alarm","fridge","stove","microwave","dishwasher","washing-machine","tumble-dryer","robot-vacuum","vacuum","shower","bathtub","toilet","water-boiler","grill","pool","tree","flower","sprout","watering-can","sprinkler","car","tune","tune-variant","cog","sync","refresh","restart","arrow-up","arrow-down","arrow-left","arrow-right","arrow-all","arrow-up-down","arrow-left-right","swap-vertical","account","account-group","calendar","clock","star","heart","flag","map-marker","tag"];let Se,Ee=class extends ct{constructor(){super(...arguments),this.label="Icon",this._open=!1,this._alignRight=!1,this._icons=[],this._onDocClick=t=>{this._open&&!t.composedPath().includes(this)&&(this._open=!1)}}get _none(){return""===this.value}get _custom(){return!!this.value}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocClick)}_emit(t){this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t},bubbles:!0,composed:!0}))}_hostBounds(){const t=this.getRootNode().host;return t?t.getBoundingClientRect():null}_toggle(t){if(t.stopPropagation(),!this._open){const t=this.getBoundingClientRect(),e=this._hostBounds(),i=e?(e.left+e.right)/2:window.innerWidth/2;this._alignRight=t.left+t.width/2>i}this._open=!this._open,this._open&&0===this._icons.length&&async function(){if(Se)return Se;const t=Ce.map(t=>({value:`mdi:${t}`,primary:`mdi:${t}`,icon:`mdi:${t}`,keywords:t.split("-")})),e=window.customIcons;if(e)for(const i of Object.keys(e)){const s=e[i]?.getIconList;if("function"==typeof s)try{const e=await s();for(const s of e)t.push({value:`${i}:${s.name}`,primary:`${i}:${s.name}`,icon:`${i}:${s.name}`,keywords:s.keywords})}catch{}}return Se=t,Se}().then(t=>{this._icons=t})}_toggleNone(t){t.stopPropagation(),this._open=!1,this._emit(this._none?void 0:"")}_onPick(t){this._open=!1,this._emit(t.detail.value)}render(){const t=this._none,e=this._custom,i=e?this.value:this.defaultIcon??"mdi:image-plus";return V`
      <div class="pill">
        <button
          type="button"
          class=${jt({seg:!0,icon:!0,active:e,preview:!e})}
          aria-haspopup="listbox"
          aria-expanded=${this._open?"true":"false"}
          title=${this.label}
          @click=${this._toggle}
        >
          <ha-icon icon=${i}></ha-icon>
        </button>
        <button
          type="button"
          class=${jt({seg:!0,cancel:!0,active:t})}
          aria-pressed=${t?"true":"false"}
          title=${t?"No icon — click to use the default":"No icon"}
          @click=${this._toggleNone}
        >
          <ha-icon icon="mdi:cancel"></ha-icon>
        </button>
      </div>
      ${this._open?V`<div class=${jt({panel:!0,right:this._alignRight})}>
            <mt-search-panel
              .items=${this._icons}
              .value=${this.value||""}
              .allowCustom=${!0}
              customPrefix="mdi:"
              placeholder="Search icons…"
              @pick=${this._onPick}
              @dismiss=${()=>this._open=!1}
            ></mt-search-panel>
          </div>`:W}
    `}};Ee.styles=a`
    :host {
      display: inline-block;
      position: relative;
    }
    .pill {
      display: inline-flex;
      height: 40px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      overflow: hidden;
    }
    .seg {
      width: 40px;
      height: 100%;
      padding: 0;
      display: grid;
      place-items: center;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        background-color 150ms cubic-bezier(0.2, 0, 0, 1),
        color 150ms cubic-bezier(0.2, 0, 0, 1);
    }
    .seg + .seg {
      border-left: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
    }
    .seg:hover {
      background: color-mix(in srgb, currentColor 10%, transparent);
    }
    .seg.active {
      background: var(--md-sys-color-primary, var(--primary-color));
      color: var(--md-sys-color-on-primary, var(--text-primary-color, #fff));
    }
    /* The faded "this is just the default / add an icon" preview. */
    .seg.icon.preview:not(.active) ha-icon {
      opacity: 0.5;
    }
    .seg ha-icon {
      --mdc-icon-size: 20px;
    }
    /* Rounded search panel anchored under the pill (matches mt-entity-picker). */
    .panel {
      position: absolute;
      z-index: 30;
      top: calc(100% + 6px);
      left: 0;
      width: 256px;
      box-sizing: border-box;
      padding: 8px;
      background: var(--md-sys-color-surface-container-high, var(--card-background-color, #fff));
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      border-radius: 16px;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 3px rgba(0, 0, 0, 0.2);
    }
    /* Anchored to the right edge of the pill so it grows leftward (used near the
       viewport's right edge to avoid horizontal overflow/scroll). */
    .panel.right {
      left: auto;
      right: 0;
    }
  `,t([mt({attribute:!1})],Ee.prototype,"hass",void 0),t([mt()],Ee.prototype,"value",void 0),t([mt()],Ee.prototype,"label",void 0),t([mt()],Ee.prototype,"defaultIcon",void 0),t([ft()],Ee.prototype,"_open",void 0),t([ft()],Ee.prototype,"_alignRight",void 0),t([ft()],Ee.prototype,"_icons",void 0),Ee=t([ht("mt-icon-field")],Ee);let Oe=class extends ct{constructor(){super(...arguments),this.value="",this.label=""}_onInput(t){const e=t.target.value;this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e},bubbles:!0,composed:!0}))}render(){return V`<input
      type="text"
      .value=${this.value??""}
      placeholder=${this.label}
      aria-label=${this.label}
      @input=${this._onInput}
    />`}};Oe.styles=a`
    :host {
      display: block;
      min-width: 0;
    }
    input {
      width: 100%;
      box-sizing: border-box;
      height: 40px;
      padding: 0 14px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      font: inherit;
      font-size: 14px;
      outline: none;
      transition: border-color 150ms cubic-bezier(0.2, 0, 0, 1);
    }
    input::placeholder {
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    input:focus {
      border-color: var(--md-sys-color-primary, var(--primary-color));
    }
  `,t([mt()],Oe.prototype,"value",void 0),t([mt()],Oe.prototype,"label",void 0),Oe=t([ht("mt-text-field")],Oe);let ze=class extends ct{_values(){const t=this.hass?.states?.[this.entityId]?.attributes;return t?"hvac"===this.kind?t.hvac_modes??[]:"fan"===this.kind?t.fan_modes??[]:"preset"===this.kind?t.preset_modes??[]:t.swing_modes??[]:[]}_orderedValues(){return It(this._values(),this.feature.order)}_defaultIcon(t){return"hvac"===this.kind?Et[t]??"mdi:thermostat":"fan"===this.kind?zt(t):"preset"===this.kind?Pt(t):Zt(t)}_moveOption(t){t.stopPropagation();const{oldIndex:e,newIndex:i}=t.detail,s=this._orderedValues(),[o]=s.splice(e,1);s.splice(i,0,o),this._emit({order:s})}_override(t){return this.feature.options?.find(e=>e.value===t)}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setOverride(t,e){const i=[...this.feature.options??[]],s=i.findIndex(e=>e.value===t),o={...s>=0?i[s]:{value:t},...e};""===o.label&&delete o.label,void 0===o.icon&&delete o.icon,o.hide||delete o.hide;const r=void 0!==o.label||void 0!==o.icon||!!o.hide;s>=0?r?i[s]=o:i.splice(s,1):r&&i.push(o),this._emit({options:i})}render(){const t=this._values(),e=this.feature.display??"icons";return V`
      <div class="editor">
        <mt-text-field
          label="Title (optional)"
          .value=${this.feature.label??""}
          @value-changed=${t=>this._emit({label:t.detail.value||void 0})}
        ></mt-text-field>

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

        ${0===t.length?V`<p class="hint">
              Pick a climate entity that exposes ${this.kind} options to customize them.
            </p>`:V`<ha-sortable handle-selector=".handle" @item-moved=${this._moveOption}>
              <div class="options">
                ${this._orderedValues().map(t=>this._renderOption(t))}
              </div>
            </ha-sortable>`}
      </div>
    `}_renderOption(t){const e=this._override(t),i=!!e?.hide;return V`
      <div class="opt">
        <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
        <div class="opt-name" title=${t}>${Dt(t)}</div>
        <mt-text-field
          class="opt-label"
          label=${Dt(t)}
          .value=${e?.label??""}
          @value-changed=${e=>this._setOverride(t,{label:e.detail.value})}
        ></mt-text-field>
        <mt-icon-field
          class="opt-icon"
          .hass=${this.hass}
          .value=${e?.icon}
          .defaultIcon=${this._defaultIcon(t)}
          @value-changed=${e=>this._setOverride(t,{icon:e.detail.value})}
        ></mt-icon-field>
        <button
          class="opt-hide ${i?"on":""}"
          aria-label=${i?"Show option":"Hide option"}
          title=${i?"Hidden":"Visible"}
          @click=${()=>this._setOverride(t,{hide:!i})}
        >
          <ha-icon icon=${i?"mdi:eye-off":"mdi:eye"}></ha-icon>
        </button>
      </div>
    `}};ze.styles=a`
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
    .opt-icon {
      min-width: 0;
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
  `,t([mt({attribute:!1})],ze.prototype,"hass",void 0),t([mt()],ze.prototype,"entityId",void 0),t([mt()],ze.prototype,"kind",void 0),t([mt({attribute:!1})],ze.prototype,"feature",void 0),ze=t([ht("mt-climate-feature-editor")],ze);const Pe={sensor:"mdi:gauge",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb",fan:"mdi:fan",input_boolean:"mdi:toggle-switch",input_select:"mdi:format-list-bulleted",button:"mdi:gesture-tap-button",input_button:"mdi:gesture-tap-button",scene:"mdi:palette",script:"mdi:script-text",climate:"mdi:thermostat"};let Ze=class extends ct{constructor(){super(...arguments),this.value="",this.label="Entity",this.allowCustom=!1,this._open=!1,this._onDocClick=t=>{this._open&&!t.composedPath().includes(this)&&(this._open=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocClick)}_iconFor(t,e){return e??Pe[t.split(".")[0]]??"mdi:tag"}_items(){const t=this.hass?.states??{};return Object.keys(t).filter(t=>!this.includeDomains||this.includeDomains.includes(t.split(".")[0])).map(e=>{const i=t[e].attributes;return{value:e,primary:i.friendly_name??e,secondary:e,icon:this._iconFor(e,i.icon)}}).sort((t,e)=>t.primary.localeCompare(e.primary))}_selected(){if(!this.value)return;const t=this.hass?.states?.[this.value]?.attributes;return{name:t?.friendly_name??this.value,icon:this._iconFor(this.value,t?.icon)}}_toggle(t){t.stopPropagation(),this._open=!this._open}_onPick(t){this._open=!1,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t.detail.value},bubbles:!0,composed:!0}))}render(){const t=this._selected();return V`
      <button
        type="button"
        class=${jt({trigger:!0,open:this._open})}
        aria-haspopup="listbox"
        aria-expanded=${this._open?"true":"false"}
        @click=${this._toggle}
      >
        ${t?V`<ha-icon class="lead" icon=${t.icon}></ha-icon>
              <span class="text">${t.name}</span>`:V`<span class="text muted">${this.label}</span>`}
        <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
      </button>
      ${this._open?V`<div class="panel">
            <mt-search-panel
              .items=${this._items()}
              .value=${this.value}
              .allowCustom=${this.allowCustom}
              placeholder="Search entities…"
              @pick=${this._onPick}
              @dismiss=${()=>this._open=!1}
            ></mt-search-panel>
          </div>`:W}
    `}};Ze.styles=a`
    :host {
      display: block;
      position: relative;
    }
    .trigger {
      width: 100%;
      box-sizing: border-box;
      height: 40px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 10px 0 14px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      cursor: pointer;
      font: inherit;
      font-size: 14px;
      -webkit-tap-highlight-color: transparent;
    }
    .trigger .lead {
      --mdc-icon-size: 20px;
      flex: 0 0 auto;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    .trigger .text {
      flex: 1;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .trigger .text.muted {
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    .trigger .chev {
      flex: 0 0 auto;
      --mdc-icon-size: 20px;
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      transition: transform 150ms cubic-bezier(0.2, 0, 0, 1);
    }
    .trigger.open .chev {
      transform: rotate(180deg);
    }
    .panel {
      position: absolute;
      z-index: 30;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      padding: 8px;
      box-sizing: border-box;
      background: var(--md-sys-color-surface-container-high, var(--card-background-color, #fff));
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      border-radius: 16px;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 3px rgba(0, 0, 0, 0.2);
    }
  `,t([mt({attribute:!1})],Ze.prototype,"hass",void 0),t([mt()],Ze.prototype,"value",void 0),t([mt()],Ze.prototype,"label",void 0),t([mt({attribute:!1})],Ze.prototype,"includeDomains",void 0),t([mt({type:Boolean})],Ze.prototype,"allowCustom",void 0),t([ft()],Ze.prototype,"_open",void 0),Ze=t([ht("mt-entity-picker")],Ze);let Ie=class extends ct{_values(){return this.hass?.states?.[this.feature.entity]?.attributes?.options??[]}_orderedValues(){return It(this._values(),this.feature.order)}_moveOption(t){t.stopPropagation();const{oldIndex:e,newIndex:i}=t.detail,s=this._orderedValues(),[o]=s.splice(e,1);s.splice(i,0,o),this._emit({order:s})}_override(t){return this.feature.options?.find(e=>e.value===t)}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setOverride(t,e){const i=[...this.feature.options??[]],s=i.findIndex(e=>e.value===t),o={...s>=0?i[s]:{value:t},...e};""===o.label&&delete o.label,void 0===o.icon&&delete o.icon,o.hide||delete o.hide;const r=void 0!==o.label||void 0!==o.icon||!!o.hide;s>=0?r?i[s]=o:i.splice(s,1):r&&i.push(o),this._emit({options:i})}render(){const t=this._values(),e=this.feature.display??"icons";return V`
      <div class="editor">
        <mt-entity-picker
          .hass=${this.hass}
          .value=${this.feature.entity??""}
          .includeDomains=${["input_select"]}
          label="Input select entity"
          .allowCustom=${!0}
          @value-changed=${t=>this._emit({entity:t.detail.value})}
        ></mt-entity-picker>

        <mt-text-field
          label="Row label (optional)"
          .value=${this.feature.label??""}
          @value-changed=${t=>this._emit({label:t.detail.value||void 0})}
        ></mt-text-field>

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

        ${0===t.length?V`<p class="hint">Pick an input_select entity to customize its options.</p>`:V`<ha-sortable handle-selector=".handle" @item-moved=${this._moveOption}>
              <div class="options">
              ${this._orderedValues().map(t=>{const e=this._override(t),i=!!e?.hide;return V`<div class="opt">
                  <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
                  <div class="opt-name" title=${t}>${Dt(t)}</div>
                  <mt-text-field
                    label=${Dt(t)}
                    .value=${e?.label??""}
                    @value-changed=${e=>this._setOverride(t,{label:e.detail.value})}
                  ></mt-text-field>
                  <mt-icon-field
                    .hass=${this.hass}
                    .value=${e?.icon}
                    @value-changed=${e=>this._setOverride(t,{icon:e.detail.value})}
                  ></mt-icon-field>
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
    `}};Ie.styles=a`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 4px 0;
    }
    mt-entity-picker {
      display: block;
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
    mt-icon-field {
      min-width: 0;
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
  `,t([mt({attribute:!1})],Ie.prototype,"hass",void 0),t([mt({attribute:!1})],Ie.prototype,"feature",void 0),Ie=t([ht("mt-input-select-editor")],Ie);let Te=class extends ct{constructor(){super(...arguments),this.itemsKey="entities",this.showDisplay=!1}get _items(){return this.feature[this.itemsKey]??[]}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setItems(t){this._emit({[this.itemsKey]:t})}_updateItem(t,e){const i=[...this._items],s={...i[t],...e};""===s.label&&delete s.label,void 0===s.icon&&delete s.icon,i[t]=s,this._setItems(i)}_addItem(){this._setItems([...this._items,{entity:""}])}_moveItem(t){t.stopPropagation();const{oldIndex:e,newIndex:i}=t.detail,s=[...this._items],[o]=s.splice(e,1);s.splice(i,0,o),this._setItems(s)}_removeItem(t){const e=[...this._items];e.splice(t,1),this._setItems(e)}render(){const t=this.feature.display??"icons";return V`
      <div class="editor">
        <mt-text-field
          label="Row label (optional)"
          .value=${this.feature.label??""}
          @value-changed=${t=>this._emit({label:t.detail.value||void 0})}
        ></mt-text-field>

        ${this.showDisplay?V`<div class="field">
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
            ${this._items.map((t,e)=>{const i=this.hass?.states?.[t.entity]?.attributes?.icon;return V`<div class="item">
                <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
                <div class="body">
                  <mt-entity-picker
                    .hass=${this.hass}
                    .value=${t.entity??""}
                    label="Entity"
                    .includeDomains=${this.includeDomains}
                    .allowCustom=${!0}
                    @value-changed=${t=>this._updateItem(e,{entity:t.detail.value})}
                  ></mt-entity-picker>
                  <div class="row2">
                    <mt-icon-field
                      .hass=${this.hass}
                      .value=${t.icon}
                      .defaultIcon=${i}
                      @value-changed=${t=>this._updateItem(e,{icon:t.detail.value})}
                    ></mt-icon-field>
                    <mt-text-field
                      class="title-field"
                      label="Custom title"
                      .value=${t.label??""}
                      @value-changed=${t=>this._updateItem(e,{label:t.detail.value})}
                    ></mt-text-field>
                  </div>
                </div>
                <button class="del" title="Remove" @click=${()=>this._removeItem(e)}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>`})}
          </div>
        </ha-sortable>

        <ha-button @click=${this._addItem}>
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          Add entity
        </ha-button>
      </div>
    `}};Te.styles=a`
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
    .items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    /* Two lines per item: entity picker on top, then the icon pill + custom
       title below. The drag handle and delete button flank both lines. */
    .item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 12px;
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
    }
    .body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }
    .row2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .title-field {
      flex: 1;
      min-width: 0;
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
  `,t([mt({attribute:!1})],Te.prototype,"hass",void 0),t([mt({attribute:!1})],Te.prototype,"feature",void 0),t([mt()],Te.prototype,"itemsKey",void 0),t([mt({type:Boolean})],Te.prototype,"showDisplay",void 0),t([mt({attribute:!1})],Te.prototype,"includeDomains",void 0),Te=t([ht("mt-entity-list-editor")],Te);const De=[{name:"entity",selector:{entity:{}}},{name:"name",selector:{text:{}}},{name:"icon",selector:{icon:{}}},{name:"compact",selector:{boolean:{}}},{name:"tap_action",selector:{ui_action:{}}}];let He=class extends ct{constructor(){super(...arguments),this._computeLabel=t=>{switch(t.name){case"entity":return"Entity";case"name":return"Name (optional)";case"icon":return"Icon (optional)";case"compact":return"Compact (icon + value only)";case"tap_action":return"Tap action";default:return t.name}}}get _data(){return{entity:this.feature.entity,name:this.feature.name,icon:this.feature.icon,compact:this.feature.compact??!1,tap_action:this.feature.tap_action}}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_changed(t){const e=t.detail.value;this._emit({entity:e.entity,name:e.name||void 0,icon:e.icon||void 0,compact:e.compact||void 0,tap_action:e.tap_action||void 0})}render(){return V`
      <ha-form
        .hass=${this.hass}
        .data=${this._data}
        .schema=${De}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._changed}
      ></ha-form>
      <mt-width-field
        .hass=${this.hass}
        .value=${this.feature.width}
        .default=${50}
        @width-changed=${t=>this._emit({width:t.detail.value})}
      ></mt-width-field>
    `}};He.styles=a`
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `,t([mt({attribute:!1})],He.prototype,"hass",void 0),t([mt({attribute:!1})],He.prototype,"feature",void 0),He=t([ht("mt-entity-tile-editor")],He);const Re=[{name:"show_target_eta",selector:{boolean:{}}}];let Ne,Fe=class extends ct{constructor(){super(...arguments),this.feelsLikeConfigured=!1,this._computeLabel=t=>"show_target_eta"===t.name?"Also show time until target temperature":t.name}get _data(){return{show_target_eta:this.feature.show_target_eta??!1}}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_changed(t){const e=t.detail.value;this._emit({show_target_eta:e.show_target_eta||void 0})}render(){return V`
      ${this.feelsLikeConfigured?W:V`<p class="warn">
            Set the temperature and humidity sensors in the “Feels-like temperature” section above
            — this feature needs them.
          </p>`}
      <ha-form
        .hass=${this.hass}
        .data=${this._data}
        .schema=${Re}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._changed}
      ></ha-form>
      <mt-width-field
        .hass=${this.hass}
        .value=${this.feature.width}
        @width-changed=${t=>this._emit({width:t.detail.value})}
      ></mt-width-field>
    `}};Fe.styles=a`
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .warn {
      margin: 0;
      padding: 8px 12px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--warning-color, #ffa600) 14%, transparent);
      color: var(--primary-text-color);
      font-size: 13px;
    }
  `,t([mt({attribute:!1})],Fe.prototype,"hass",void 0),t([mt({attribute:!1})],Fe.prototype,"feature",void 0),t([mt({type:Boolean})],Fe.prototype,"feelsLikeConfigured",void 0),Fe=t([ht("mt-comfort-editor")],Fe);const je=[{name:"entity",selector:{entity:{domain:"climate"}}},{name:"name",selector:{text:{}}},{name:"theme",selector:{theme:{}}},{name:"show_current_as_primary",selector:{boolean:{}}}],Ue=[{name:"temperature",selector:{entity:{domain:"sensor"}}},{name:"humidity",selector:{entity:{domain:"sensor"}}},{name:"show_as_current",selector:{boolean:{}}}],Ve=[{type:"climate-hvac-modes",label:"Climate HVAC modes"},{type:"climate-fan-modes",label:"Climate fan modes"},{type:"climate-swing-modes",label:"Climate swing modes"},{type:"climate-preset-modes",label:"Climate preset modes"},{type:"comfort",label:"Comfort & time to comfortable"},{type:"input-select",label:"Input select"},{type:"switch-group",label:"Switch group"},{type:"switch-list",label:"Switch list"},{type:"button-list",label:"Button list"},{type:"entity-tile",label:"Entity tile"},{type:"sensor-list",label:"Sensor list"}],qe={"climate-hvac-modes":"hvac_modes","climate-fan-modes":"fan_modes","climate-swing-modes":"swing_modes","climate-preset-modes":"preset_modes"},Be=new Set(["comfort"]);function We(t){switch(t){case"input-select":case"entity-tile":return{type:t,entity:""};case"switch-group":case"switch-list":return{type:t,entities:[]};case"button-list":case"sensor-list":return{type:t,items:[]};case"comfort":return{type:t,show_target_eta:!1};default:return{type:t}}}const Ke={"climate-hvac-modes":"Climate HVAC modes","climate-fan-modes":"Climate fan modes","climate-swing-modes":"Climate swing modes","climate-preset-modes":"Climate preset modes",comfort:"Comfort & time to comfortable","input-select":"Input select","switch-group":"Switch group","switch-list":"Switch list","button-list":"Button list","entity-tile":"Entity tile","sensor-list":"Sensor list"};let Xe=class extends ct{constructor(){super(...arguments),this._editingIndex=null,this._addOpen=!1,this._computeLabel=t=>{switch(t.name){case"entity":return"Climate entity (required)";case"name":return"Name";case"theme":return"Theme";case"show_current_as_primary":return"Show current temperature as primary information";case"temperature":return"Temperature sensor";case"humidity":return"Humidity sensor";case"show_as_current":return"Show feels-like as the current temperature";default:return t.name}}}connectedCallback(){super.connectedCallback(),(Ne||(Ne=(async()=>{if(customElements.get("ha-form")&&customElements.get("ha-entity-picker")&&customElements.get("ha-icon-picker"))return;const t=window.loadCardHelpers;if(t)try{const e=await t(),i=await e.createCardElement({type:"entities",entities:[]}),s=i?.constructor;s?.getConfigElement&&await s.getConfigElement()}catch{}})(),Ne)).then(()=>this.requestUpdate())}setConfig(t){this._config=t}get _baseData(){return{entity:this._config.entity,name:this._config.name,theme:this._config.theme,show_current_as_primary:this._config.show_current_as_primary??!1}}get _feelsLikeData(){const t=this._config.feels_like??{};return{temperature:t.temperature,humidity:t.humidity,show_as_current:t.show_as_current??!1}}_emit(t){this._config=t,yt(this,"config-changed",{config:t})}_baseChanged(t){const e=t.detail.value,i={...this._config,entity:e.entity,name:e.name||void 0,theme:e.theme||void 0,show_current_as_primary:e.show_current_as_primary||void 0};this._emit(i)}_feelsLikeChanged(t){const e=t.detail.value,i={temperature:e.temperature||void 0,humidity:e.humidity||void 0,show_as_current:e.show_as_current||void 0},s=!i.temperature&&!i.humidity&&!i.show_as_current;this._emit({...this._config,feels_like:s?void 0:i})}get _features(){return this._config.features??[]}_addableFeatures(){const t=this.hass?.states?.[this._config.entity]?.attributes??{},e=new Set(this._features.map(t=>t.type));return Ve.filter(({type:i})=>{if(Be.has(i))return!e.has(i);const s=qe[i];return!s||!e.has(i)&&Array.isArray(t[s])&&t[s].length>0})}_setFeatures(t){this._emit({...this._config,features:t})}_pickFeature(t){this._addOpen=!1;const e=[...this._features,We(t)];this._editingIndex=e.length-1,this._setFeatures(e)}_removeFeature(t){const e=[...this._features];e.splice(t,1),this._editingIndex=null,this._setFeatures(e)}_moveFeature(t){const{oldIndex:e,newIndex:i}=t.detail,s=[...this._features],[o]=s.splice(e,1);s.splice(i,0,o),this._editingIndex=null,this._setFeatures(s)}_featureChanged(t,e){const i=[...this._features];i[t]=e.detail.feature,this._setFeatures(i)}render(){return this._config&&this.hass?V`
      <div class="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._baseData}
          .schema=${je}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._baseChanged}
        ></ha-form>

        <div class="features-header">
          <span>Feels-like temperature</span>
        </div>
        <ha-form
          .hass=${this.hass}
          .data=${this._feelsLikeData}
          .schema=${Ue}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._feelsLikeChanged}
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
          ${this._addOpen?V`<div class="add-menu">
                ${this._addableFeatures().map(t=>V`<button class="add-opt" @click=${()=>this._pickFeature(t.type)}>
                    ${t.label}
                  </button>`)}
              </div>`:W}
        </div>
      </div>
    `:V``}_renderFeatureRow(t,e){const i=this._editingIndex===e;return V`
      <div class="feature">
        <div class="feature-head">
          <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
          <div class="feature-title">${Ke[t.type]??t.type}</div>
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
    `}_renderFeatureEditor(t,e){const i=t=>this._featureChanged(e,t);let s;switch(t.type){case"climate-hvac-modes":case"climate-fan-modes":case"climate-swing-modes":case"climate-preset-modes":{const e="climate-hvac-modes"===t.type?"hvac":"climate-fan-modes"===t.type?"fan":"climate-preset-modes"===t.type?"preset":"swing";s=V`<mt-climate-feature-editor
          .hass=${this.hass}
          .entityId=${this._config.entity}
          kind=${e}
          .feature=${t}
          @feature-changed=${i}
        ></mt-climate-feature-editor>`;break}case"input-select":s=V`<mt-input-select-editor
          .hass=${this.hass}
          .feature=${t}
          @feature-changed=${i}
        ></mt-input-select-editor>`;break;case"switch-group":s=V`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${t}
          itemsKey="entities"
          .showDisplay=${!0}
          .includeDomains=${["switch","input_boolean","light","fan"]}
          @feature-changed=${i}
        ></mt-entity-list-editor>`;break;case"switch-list":s=V`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${t}
          itemsKey="entities"
          .includeDomains=${["switch","input_boolean","light","fan"]}
          @feature-changed=${i}
        ></mt-entity-list-editor>`;break;case"button-list":s=V`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${t}
          itemsKey="items"
          .includeDomains=${["button","input_button","scene","script"]}
          @feature-changed=${i}
        ></mt-entity-list-editor>`;break;case"entity-tile":s=V`<mt-entity-tile-editor
          .hass=${this.hass}
          .feature=${t}
          @feature-changed=${i}
        ></mt-entity-tile-editor>`;break;case"sensor-list":s=V`<mt-entity-list-editor
          .hass=${this.hass}
          .feature=${t}
          itemsKey="items"
          .includeDomains=${["sensor","binary_sensor"]}
          @feature-changed=${i}
        ></mt-entity-list-editor>`;break;case"comfort":s=V`<mt-comfort-editor
          .hass=${this.hass}
          .feature=${t}
          .feelsLikeConfigured=${!(!this._config.feels_like?.temperature||!this._config.feels_like?.humidity)}
          @feature-changed=${i}
        ></mt-comfort-editor>`;break;default:s=V`<p class="hint">No editor available.</p>`}return V`<div class="feature-editor">${s}</div>`}};Xe.styles=a`
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
      /* visible (not hidden) so a feature's icon-picker popover can extend past
         the card edge instead of being clipped inside it */
      overflow: visible;
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
  `,t([mt({attribute:!1})],Xe.prototype,"hass",void 0),t([ft()],Xe.prototype,"_config",void 0),t([ft()],Xe.prototype,"_editingIndex",void 0),t([ft()],Xe.prototype,"_addOpen",void 0),Xe=t([ht(Mt)],Xe);var Ye=Object.freeze({__proto__:null,get MaterialThermostatCardEditor(){return Xe}});export{xe as MaterialThermostatCard};
