function t(t,e,i,s){var a,o=arguments.length,r=o<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,s);else for(var n=t.length-1;n>=0;n--)(a=t[n])&&(r=(o<3?a(r):o>3?a(e,i,r):a(e,i))||r);return o>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),a=new WeakMap;let o=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=a.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&a.set(e,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new o(i,t,s)},n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,f=m.trustedTypes,v=f?f.emptyScript:"",g=m.reactiveElementPolyfillSupport,y=(t,e)=>t,_={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},b=(t,e)=>!l(t,e),$={attribute:!0,type:String,converter:_,reflect:!1,useDefault:!1,hasChanged:b};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=$){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:a}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const o=s?.call(this);a?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??$}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const t=this.properties,e=[...h(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),a=e.litNonce;void 0!==a&&s.setAttribute("nonce",a),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const a=(void 0!==i.converter?.toAttribute?i.converter:_).toAttribute(e,i.type);this._$Em=t,null==a?this.removeAttribute(s):this.setAttribute(s,a),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),a="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:_;this._$Em=s;const o=a.fromAttribute(e,t.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i,s=!1,a){if(void 0!==t){const o=this.constructor;if(!1===s&&(a=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??b)(a,e)||i.useDefault&&i.reflect&&a===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:a},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==a||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[y("elementProperties")]=new Map,w[y("finalized")]=new Map,g?.({ReactiveElement:w}),(m.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,A=t=>t,L=x.trustedTypes,M=L?L.createPolicy("lit-html",{createHTML:t=>t}):void 0,k="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,S="?"+C,E=`<${S}>`,O=document,Z=()=>O.createComment(""),z=t=>null===t||"object"!=typeof t&&"function"!=typeof t,P=Array.isArray,H="[ \t\n\f\r]",I=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,T=/-->/g,j=/>/g,U=RegExp(`>|${H}(?:([^\\s"'>=/]+)(${H}*=${H}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),D=/'/g,R=/"/g,N=/^(?:script|style|textarea|title)$/i,F=(t,...e)=>({_$litType$:1,strings:t,values:e}),V=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),B=new WeakMap,W=O.createTreeWalker(O,129);function K(t,e){if(!P(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==M?M.createHTML(e):e}const Y=(t,e)=>{const i=t.length-1,s=[];let a,o=2===e?"<svg>":3===e?"<math>":"",r=I;for(let e=0;e<i;e++){const i=t[e];let n,l,c=-1,d=0;for(;d<i.length&&(r.lastIndex=d,l=r.exec(i),null!==l);)d=r.lastIndex,r===I?"!--"===l[1]?r=T:void 0!==l[1]?r=j:void 0!==l[2]?(N.test(l[2])&&(a=RegExp("</"+l[2],"g")),r=U):void 0!==l[3]&&(r=U):r===U?">"===l[0]?(r=a??I,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,n=l[1],r=void 0===l[3]?U:'"'===l[3]?R:D):r===R||r===D?r=U:r===T||r===j?r=I:(r=U,a=void 0);const h=r===U&&t[e+1].startsWith("/>")?" ":"";o+=r===I?i+E:c>=0?(s.push(n),i.slice(0,c)+k+i.slice(c)+C+h):i+C+(-2===c?e:h)}return[K(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class G{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let a=0,o=0;const r=t.length-1,n=this.parts,[l,c]=Y(t,e);if(this.el=G.createElement(l,i),W.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=W.nextNode())&&n.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(k)){const e=c[o++],i=s.getAttribute(t).split(C),r=/([.?@])?(.*)/.exec(e);n.push({type:1,index:a,name:r[2],strings:i,ctor:"."===r[1]?et:"?"===r[1]?it:"@"===r[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(C)&&(n.push({type:6,index:a}),s.removeAttribute(t));if(N.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=L?L.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],Z()),W.nextNode(),n.push({type:2,index:++a});s.append(t[e],Z())}}}else if(8===s.nodeType)if(s.data===S)n.push({type:2,index:a});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)n.push({type:7,index:a}),t+=C.length-1}a++}}static createElement(t,e){const i=O.createElement("template");return i.innerHTML=t,i}}function X(t,e,i=t,s){if(e===V)return e;let a=void 0!==s?i._$Co?.[s]:i._$Cl;const o=z(e)?void 0:e._$litDirective$;return a?.constructor!==o&&(a?._$AO?.(!1),void 0===o?a=void 0:(a=new o(t),a._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=a:i._$Cl=a),void 0!==a&&(e=X(t,a._$AS(t,e.values),a,s)),e}class J{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??O).importNode(e,!0);W.currentNode=s;let a=W.nextNode(),o=0,r=0,n=i[0];for(;void 0!==n;){if(o===n.index){let e;2===n.type?e=new Q(a,a.nextSibling,this,t):1===n.type?e=new n.ctor(a,n.name,n.strings,this,t):6===n.type&&(e=new at(a,this,t)),this._$AV.push(e),n=i[++r]}o!==n?.index&&(a=W.nextNode(),o++)}return W.currentNode=O,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=X(this,t,e),z(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==V&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>P(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&z(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=G.createElement(K(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new J(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=B.get(t.strings);return void 0===e&&B.set(t.strings,e=new G(t)),e}k(t){P(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const a of t)s===e.length?e.push(i=new Q(this.O(Z()),this.O(Z()),this,this.options)):i=e[s],i._$AI(a),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,a){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=a,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(t,e=this,i,s){const a=this.strings;let o=!1;if(void 0===a)t=X(this,t,e,0),o=!z(t)||t!==this._$AH&&t!==V,o&&(this._$AH=t);else{const s=t;let r,n;for(t=a[0],r=0;r<a.length-1;r++)n=X(this,s[i+r],e,r),n===V&&(n=this._$AH[r]),o||=!z(n)||n!==this._$AH[r],n===q?t=q:t!==q&&(t+=(n??"")+a[r+1]),this._$AH[r]=n}o&&!s&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class st extends tt{constructor(t,e,i,s,a){super(t,e,i,s,a),this.type=5}_$AI(t,e=this){if((t=X(this,t,e,0)??q)===V)return;const i=this._$AH,s=t===q&&i!==q||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,a=t!==q&&(i===q||s);s&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){X(this,t)}}const ot=x.litHtmlPolyfillSupport;ot?.(G,Q),(x.litHtmlVersions??=[]).push("3.3.3");const rt=globalThis;let nt=class extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let a=s._$litPart$;if(void 0===a){const t=i?.renderBefore??null;s._$litPart$=a=new Q(e.insertBefore(Z(),t),t,void 0,i??{})}return a._$AI(t),a})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}};nt._$litElement$=!0,nt.finalized=!0,rt.litElementHydrateSupport?.({LitElement:nt});const lt=rt.litElementPolyfillSupport;lt?.({LitElement:nt}),(rt.litElementVersions??=[]).push("4.2.2");const ct=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},dt={attribute:!0,type:String,converter:_,reflect:!1,hasChanged:b},ht=(t=dt,e,i)=>{const{kind:s,metadata:a}=i;let o=globalThis.litPropertyMetadata.get(a);if(void 0===o&&globalThis.litPropertyMetadata.set(a,o=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const a=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,a,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const a=this[s];e.call(this,i),this.requestUpdate(s,a,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pt(t){return(e,i)=>"object"==typeof i?ht(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ut(t){return pt({...t,state:!0,attribute:!1})}var mt,ft;function vt(){return(vt=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var s in i)Object.prototype.hasOwnProperty.call(i,s)&&(t[s]=i[s])}return t}).apply(this,arguments)}!function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(mt||(mt={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(ft||(ft={}));var gt=function(t,e,i,s){s=s||{},i=null==i?{}:i;var a=new Event(e,{bubbles:void 0===s.bubbles||s.bubbles,cancelable:Boolean(s.cancelable),composed:void 0===s.composed||s.composed});return a.detail=i,t.dispatchEvent(a),a};const yt=t=>(...e)=>({_$litDirective$:t,values:e});let _t=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};const bt="important",$t=" !"+bt,wt=yt(class extends _t{constructor(t){if(super(t),1!==t.type||"style"!==t.name||t.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(t){return Object.keys(t).reduce((e,i)=>{const s=t[i];return null==s?e:e+`${i=i.includes("-")?i:i.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${s};`},"")}update(t,[e]){const{style:i}=t.element;if(void 0===this.ft)return this.ft=new Set(Object.keys(e)),this.render(e);for(const t of this.ft)null==e[t]&&(this.ft.delete(t),t.includes("-")?i.removeProperty(t):i[t]=null);for(const t in e){const s=e[t];if(null!=s){this.ft.add(t);const e="string"==typeof s&&s.endsWith($t);t.includes("-")||e?i.setProperty(t,e?s.slice(0,-11):s,e?bt:""):i[t]=s}}return V}}),xt="material-thermostat-card",At="material-thermostat-card-editor";function Lt(t){return 48*t}const Mt=r`
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
`,kt={off:"mdi:power",heat:"mdi:fire",cool:"mdi:snowflake",heat_cool:"mdi:sun-snowflake-variant",auto:"mdi:thermostat-auto",dry:"mdi:water-percent",fan_only:"mdi:fan"};function Ct(t){switch(t){case"cool":return"var(--state-climate-cool-color, #2b9af9)";case"heat":return"var(--state-climate-heat-color, #ff8100)";case"heat_cool":return"var(--state-climate-heat_cool-color, #009688)";case"auto":return"var(--state-climate-auto-color, #e5c454)";case"dry":return"var(--state-climate-dry-color, #efbd07)";case"fan_only":return"var(--state-climate-fan_only-color, #8a8a8a)";default:return"var(--state-climate-off-color, var(--mt-on-surface-variant))"}}function St(t){return"heat_cool"===t?"Heat/Cool":t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}const Et={"swing-vertical-fixed-top":{path:"M2.8 3.3L2.8 20.9A0.9 0.9 0 0 1 4.6 20.9L4.6 3.3A0.9 0.9 0 0 1 2.8 3.3ZM3.3 4.2L20.2 4.2A0.9 0.9 0 0 1 20.2 2.4L3.3 2.4A0.9 0.9 0 0 1 3.3 4.2ZM17.992 4.132A13.4 13.4 0 0 1 17.691 7.459L8.801 5.517A4.3 4.3 0 0 0 8.897 4.45Z",secondary:"M17.42 8.5A13.4 13.4 0 0 1 16.057 11.55L8.277 6.83A4.3 4.3 0 0 0 8.714 5.851ZM15.463 12.446A13.4 13.4 0 0 1 13.185 14.889L7.355 7.902A4.3 4.3 0 0 0 8.086 7.118ZM12.332 15.544A13.4 13.4 0 0 1 9.385 17.117L6.135 8.617A4.3 4.3 0 0 0 7.081 8.112ZM8.365 17.46A13.4 13.4 0 0 1 5.068 17.992L4.75 8.897A4.3 4.3 0 0 0 5.808 8.727Z"},"swing-vertical-fixed-upper-middle":{path:"M2.8 3.3L2.8 20.9A0.9 0.9 0 0 1 4.6 20.9L4.6 3.3A0.9 0.9 0 0 1 2.8 3.3ZM3.3 4.2L20.2 4.2A0.9 0.9 0 0 1 20.2 2.4L3.3 2.4A0.9 0.9 0 0 1 3.3 4.2ZM17.42 8.5A13.4 13.4 0 0 1 16.057 11.55L8.277 6.83A4.3 4.3 0 0 0 8.714 5.851Z",secondary:"M17.992 4.132A13.4 13.4 0 0 1 17.691 7.459L8.801 5.517A4.3 4.3 0 0 0 8.897 4.45ZM15.463 12.446A13.4 13.4 0 0 1 13.185 14.889L7.355 7.902A4.3 4.3 0 0 0 8.086 7.118ZM12.332 15.544A13.4 13.4 0 0 1 9.385 17.117L6.135 8.617A4.3 4.3 0 0 0 7.081 8.112ZM8.365 17.46A13.4 13.4 0 0 1 5.068 17.992L4.75 8.897A4.3 4.3 0 0 0 5.808 8.727Z"},"swing-vertical-fixed-middle":{path:"M2.8 3.3L2.8 20.9A0.9 0.9 0 0 1 4.6 20.9L4.6 3.3A0.9 0.9 0 0 1 2.8 3.3ZM3.3 4.2L20.2 4.2A0.9 0.9 0 0 1 20.2 2.4L3.3 2.4A0.9 0.9 0 0 1 3.3 4.2ZM15.463 12.446A13.4 13.4 0 0 1 13.185 14.889L7.355 7.902A4.3 4.3 0 0 0 8.086 7.118Z",secondary:"M17.992 4.132A13.4 13.4 0 0 1 17.691 7.459L8.801 5.517A4.3 4.3 0 0 0 8.897 4.45ZM17.42 8.5A13.4 13.4 0 0 1 16.057 11.55L8.277 6.83A4.3 4.3 0 0 0 8.714 5.851ZM12.332 15.544A13.4 13.4 0 0 1 9.385 17.117L6.135 8.617A4.3 4.3 0 0 0 7.081 8.112ZM8.365 17.46A13.4 13.4 0 0 1 5.068 17.992L4.75 8.897A4.3 4.3 0 0 0 5.808 8.727Z"},"swing-vertical-fixed-lower-middle":{path:"M2.8 3.3L2.8 20.9A0.9 0.9 0 0 1 4.6 20.9L4.6 3.3A0.9 0.9 0 0 1 2.8 3.3ZM3.3 4.2L20.2 4.2A0.9 0.9 0 0 1 20.2 2.4L3.3 2.4A0.9 0.9 0 0 1 3.3 4.2ZM12.332 15.544A13.4 13.4 0 0 1 9.385 17.117L6.135 8.617A4.3 4.3 0 0 0 7.081 8.112Z",secondary:"M17.992 4.132A13.4 13.4 0 0 1 17.691 7.459L8.801 5.517A4.3 4.3 0 0 0 8.897 4.45ZM17.42 8.5A13.4 13.4 0 0 1 16.057 11.55L8.277 6.83A4.3 4.3 0 0 0 8.714 5.851ZM15.463 12.446A13.4 13.4 0 0 1 13.185 14.889L7.355 7.902A4.3 4.3 0 0 0 8.086 7.118ZM8.365 17.46A13.4 13.4 0 0 1 5.068 17.992L4.75 8.897A4.3 4.3 0 0 0 5.808 8.727Z"},"swing-vertical-fixed-bottom":{path:"M2.8 3.3L2.8 20.9A0.9 0.9 0 0 1 4.6 20.9L4.6 3.3A0.9 0.9 0 0 1 2.8 3.3ZM3.3 4.2L20.2 4.2A0.9 0.9 0 0 1 20.2 2.4L3.3 2.4A0.9 0.9 0 0 1 3.3 4.2ZM8.365 17.46A13.4 13.4 0 0 1 5.068 17.992L4.75 8.897A4.3 4.3 0 0 0 5.808 8.727Z",secondary:"M17.992 4.132A13.4 13.4 0 0 1 17.691 7.459L8.801 5.517A4.3 4.3 0 0 0 8.897 4.45ZM17.42 8.5A13.4 13.4 0 0 1 16.057 11.55L8.277 6.83A4.3 4.3 0 0 0 8.714 5.851ZM15.463 12.446A13.4 13.4 0 0 1 13.185 14.889L7.355 7.902A4.3 4.3 0 0 0 8.086 7.118ZM12.332 15.544A13.4 13.4 0 0 1 9.385 17.117L6.135 8.617A4.3 4.3 0 0 0 7.081 8.112Z"},"swing-vertical-top":{path:"M2.8 3.3L2.8 20.9A0.9 0.9 0 0 1 4.6 20.9L4.6 3.3A0.9 0.9 0 0 1 2.8 3.3ZM3.3 4.2L20.2 4.2A0.9 0.9 0 0 1 20.2 2.4L3.3 2.4A0.9 0.9 0 0 1 3.3 4.2ZM17.992 4.132A13.4 13.4 0 0 1 17.691 7.459L8.801 5.517A4.3 4.3 0 0 0 8.897 4.45ZM17.42 8.5A13.4 13.4 0 0 1 16.057 11.55L8.277 6.83A4.3 4.3 0 0 0 8.714 5.851ZM15.463 12.446A13.4 13.4 0 0 1 13.185 14.889L7.355 7.902A4.3 4.3 0 0 0 8.086 7.118ZM19.445 11.209A16.25 16.25 0 0 1 2.901 20.761L3.079 19.07A14.55 14.55 0 0 0 17.892 10.518ZM20.011 7.849L21.094 12.053L16.161 9.857ZM-0.292 19.571L3.372 17.241L2.807 22.611Z",secondary:"M12.332 15.544A13.4 13.4 0 0 1 9.385 17.117L6.135 8.617A4.3 4.3 0 0 0 7.081 8.112ZM8.365 17.46A13.4 13.4 0 0 1 5.068 17.992L4.75 8.897A4.3 4.3 0 0 0 5.808 8.727Z"},"swing-vertical-middle":{path:"M2.8 3.3L2.8 20.9A0.9 0.9 0 0 1 4.6 20.9L4.6 3.3A0.9 0.9 0 0 1 2.8 3.3ZM3.3 4.2L20.2 4.2A0.9 0.9 0 0 1 20.2 2.4L3.3 2.4A0.9 0.9 0 0 1 3.3 4.2ZM17.42 8.5A13.4 13.4 0 0 1 16.057 11.55L8.277 6.83A4.3 4.3 0 0 0 8.714 5.851ZM15.463 12.446A13.4 13.4 0 0 1 13.185 14.889L7.355 7.902A4.3 4.3 0 0 0 8.086 7.118ZM12.332 15.544A13.4 13.4 0 0 1 9.385 17.117L6.135 8.617A4.3 4.3 0 0 0 7.081 8.112ZM19.445 11.209A16.25 16.25 0 0 1 2.901 20.761L3.079 19.07A14.55 14.55 0 0 0 17.892 10.518ZM20.011 7.849L21.094 12.053L16.161 9.857ZM-0.292 19.571L3.372 17.241L2.807 22.611Z",secondary:"M17.992 4.132A13.4 13.4 0 0 1 17.691 7.459L8.801 5.517A4.3 4.3 0 0 0 8.897 4.45ZM8.365 17.46A13.4 13.4 0 0 1 5.068 17.992L4.75 8.897A4.3 4.3 0 0 0 5.808 8.727Z"},"swing-vertical-bottom":{path:"M2.8 3.3L2.8 20.9A0.9 0.9 0 0 1 4.6 20.9L4.6 3.3A0.9 0.9 0 0 1 2.8 3.3ZM3.3 4.2L20.2 4.2A0.9 0.9 0 0 1 20.2 2.4L3.3 2.4A0.9 0.9 0 0 1 3.3 4.2ZM15.463 12.446A13.4 13.4 0 0 1 13.185 14.889L7.355 7.902A4.3 4.3 0 0 0 8.086 7.118ZM12.332 15.544A13.4 13.4 0 0 1 9.385 17.117L6.135 8.617A4.3 4.3 0 0 0 7.081 8.112ZM8.365 17.46A13.4 13.4 0 0 1 5.068 17.992L4.75 8.897A4.3 4.3 0 0 0 5.808 8.727ZM19.445 11.209A16.25 16.25 0 0 1 2.901 20.761L3.079 19.07A14.55 14.55 0 0 0 17.892 10.518ZM20.011 7.849L21.094 12.053L16.161 9.857ZM-0.292 19.571L3.372 17.241L2.807 22.611Z",secondary:"M17.992 4.132A13.4 13.4 0 0 1 17.691 7.459L8.801 5.517A4.3 4.3 0 0 0 8.897 4.45ZM17.42 8.5A13.4 13.4 0 0 1 16.057 11.55L8.277 6.83A4.3 4.3 0 0 0 8.714 5.851Z"},"swing-vertical-full":{path:"M2.8 3.3L2.8 20.9A0.9 0.9 0 0 1 4.6 20.9L4.6 3.3A0.9 0.9 0 0 1 2.8 3.3ZM3.3 4.2L20.2 4.2A0.9 0.9 0 0 1 20.2 2.4L3.3 2.4A0.9 0.9 0 0 1 3.3 4.2ZM17.992 4.132A13.4 13.4 0 0 1 17.691 7.459L8.801 5.517A4.3 4.3 0 0 0 8.897 4.45ZM17.42 8.5A13.4 13.4 0 0 1 16.057 11.55L8.277 6.83A4.3 4.3 0 0 0 8.714 5.851ZM15.463 12.446A13.4 13.4 0 0 1 13.185 14.889L7.355 7.902A4.3 4.3 0 0 0 8.086 7.118ZM12.332 15.544A13.4 13.4 0 0 1 9.385 17.117L6.135 8.617A4.3 4.3 0 0 0 7.081 8.112ZM8.365 17.46A13.4 13.4 0 0 1 5.068 17.992L4.75 8.897A4.3 4.3 0 0 0 5.808 8.727ZM19.445 11.209A16.25 16.25 0 0 1 2.901 20.761L3.079 19.07A14.55 14.55 0 0 0 17.892 10.518ZM20.011 7.849L21.094 12.053L16.161 9.857ZM-0.292 19.571L3.372 17.241L2.807 22.611Z"},"swing-horizontal-fixed-left":{path:"M3 7.6L21 7.6A1 1 0 0 1 21 5.6L3 5.6A1 1 0 0 1 3 7.6ZM6.038 8.601L3.438 18.701A1.2 1.2 0 0 1 5.762 19.299L8.362 9.199A1.2 1.2 0 0 1 6.038 8.601Z",secondary:"M8.807 8.798L7.507 18.898A0.8 0.8 0 0 1 9.093 19.102L10.393 9.002A0.8 0.8 0 0 1 8.807 8.798ZM11.2 8.9L11.2 19A0.8 0.8 0 0 1 12.8 19L12.8 8.9A0.8 0.8 0 0 1 11.2 8.9ZM13.607 9.002L14.907 19.102A0.8 0.8 0 0 1 16.493 18.898L15.193 8.798A0.8 0.8 0 0 1 13.607 9.002ZM16.025 9.099L18.625 19.199A0.8 0.8 0 0 1 20.175 18.801L17.575 8.701A0.8 0.8 0 0 1 16.025 9.099Z"},"swing-horizontal-fixed-left-middle":{path:"M3 7.6L21 7.6A1 1 0 0 1 21 5.6L3 5.6A1 1 0 0 1 3 7.6ZM8.41 8.747L7.11 18.847A1.2 1.2 0 0 1 9.49 19.153L10.79 9.053A1.2 1.2 0 0 1 8.41 8.747Z",secondary:"M6.425 8.701L3.825 18.801A0.8 0.8 0 0 1 5.375 19.199L7.975 9.099A0.8 0.8 0 0 1 6.425 8.701ZM11.2 8.9L11.2 19A0.8 0.8 0 0 1 12.8 19L12.8 8.9A0.8 0.8 0 0 1 11.2 8.9ZM13.607 9.002L14.907 19.102A0.8 0.8 0 0 1 16.493 18.898L15.193 8.798A0.8 0.8 0 0 1 13.607 9.002ZM16.025 9.099L18.625 19.199A0.8 0.8 0 0 1 20.175 18.801L17.575 8.701A0.8 0.8 0 0 1 16.025 9.099Z"},"swing-horizontal-fixed-middle":{path:"M3 7.6L21 7.6A1 1 0 0 1 21 5.6L3 5.6A1 1 0 0 1 3 7.6ZM10.8 8.9L10.8 19A1.2 1.2 0 0 1 13.2 19L13.2 8.9A1.2 1.2 0 0 1 10.8 8.9Z",secondary:"M6.425 8.701L3.825 18.801A0.8 0.8 0 0 1 5.375 19.199L7.975 9.099A0.8 0.8 0 0 1 6.425 8.701ZM8.807 8.798L7.507 18.898A0.8 0.8 0 0 1 9.093 19.102L10.393 9.002A0.8 0.8 0 0 1 8.807 8.798ZM13.607 9.002L14.907 19.102A0.8 0.8 0 0 1 16.493 18.898L15.193 8.798A0.8 0.8 0 0 1 13.607 9.002ZM16.025 9.099L18.625 19.199A0.8 0.8 0 0 1 20.175 18.801L17.575 8.701A0.8 0.8 0 0 1 16.025 9.099Z"},"swing-horizontal-fixed-right-middle":{path:"M3 7.6L21 7.6A1 1 0 0 1 21 5.6L3 5.6A1 1 0 0 1 3 7.6ZM13.21 9.053L14.51 19.153A1.2 1.2 0 0 1 16.89 18.847L15.59 8.747A1.2 1.2 0 0 1 13.21 9.053Z",secondary:"M6.425 8.701L3.825 18.801A0.8 0.8 0 0 1 5.375 19.199L7.975 9.099A0.8 0.8 0 0 1 6.425 8.701ZM8.807 8.798L7.507 18.898A0.8 0.8 0 0 1 9.093 19.102L10.393 9.002A0.8 0.8 0 0 1 8.807 8.798ZM11.2 8.9L11.2 19A0.8 0.8 0 0 1 12.8 19L12.8 8.9A0.8 0.8 0 0 1 11.2 8.9ZM16.025 9.099L18.625 19.199A0.8 0.8 0 0 1 20.175 18.801L17.575 8.701A0.8 0.8 0 0 1 16.025 9.099Z"},"swing-horizontal-fixed-right":{path:"M3 7.6L21 7.6A1 1 0 0 1 21 5.6L3 5.6A1 1 0 0 1 3 7.6ZM15.638 9.199L18.238 19.299A1.2 1.2 0 0 1 20.562 18.701L17.962 8.601A1.2 1.2 0 0 1 15.638 9.199Z",secondary:"M6.425 8.701L3.825 18.801A0.8 0.8 0 0 1 5.375 19.199L7.975 9.099A0.8 0.8 0 0 1 6.425 8.701ZM8.807 8.798L7.507 18.898A0.8 0.8 0 0 1 9.093 19.102L10.393 9.002A0.8 0.8 0 0 1 8.807 8.798ZM11.2 8.9L11.2 19A0.8 0.8 0 0 1 12.8 19L12.8 8.9A0.8 0.8 0 0 1 11.2 8.9ZM13.607 9.002L14.907 19.102A0.8 0.8 0 0 1 16.493 18.898L15.193 8.798A0.8 0.8 0 0 1 13.607 9.002Z"},"swing-horizontal-left":{path:"M3 7.6L21 7.6A1 1 0 0 1 21 5.6L3 5.6A1 1 0 0 1 3 7.6ZM6.038 8.601L3.438 18.701A1.2 1.2 0 0 1 5.762 19.299L8.362 9.199A1.2 1.2 0 0 1 6.038 8.601ZM8.41 8.747L7.11 18.847A1.2 1.2 0 0 1 9.49 19.153L10.79 9.053A1.2 1.2 0 0 1 8.41 8.747ZM10.8 8.9L10.8 19A1.2 1.2 0 0 1 13.2 19L13.2 8.9A1.2 1.2 0 0 1 10.8 8.9Z",secondary:"M13.607 9.002L14.907 19.102A0.8 0.8 0 0 1 16.493 18.898L15.193 8.798A0.8 0.8 0 0 1 13.607 9.002ZM16.025 9.099L18.625 19.199A0.8 0.8 0 0 1 20.175 18.801L17.575 8.701A0.8 0.8 0 0 1 16.025 9.099Z"},"swing-horizontal-middle":{path:"M3 7.6L21 7.6A1 1 0 0 1 21 5.6L3 5.6A1 1 0 0 1 3 7.6ZM8.41 8.747L7.11 18.847A1.2 1.2 0 0 1 9.49 19.153L10.79 9.053A1.2 1.2 0 0 1 8.41 8.747ZM10.8 8.9L10.8 19A1.2 1.2 0 0 1 13.2 19L13.2 8.9A1.2 1.2 0 0 1 10.8 8.9ZM13.21 9.053L14.51 19.153A1.2 1.2 0 0 1 16.89 18.847L15.59 8.747A1.2 1.2 0 0 1 13.21 9.053Z",secondary:"M6.425 8.701L3.825 18.801A0.8 0.8 0 0 1 5.375 19.199L7.975 9.099A0.8 0.8 0 0 1 6.425 8.701ZM16.025 9.099L18.625 19.199A0.8 0.8 0 0 1 20.175 18.801L17.575 8.701A0.8 0.8 0 0 1 16.025 9.099Z"},"swing-horizontal-right":{path:"M3 7.6L21 7.6A1 1 0 0 1 21 5.6L3 5.6A1 1 0 0 1 3 7.6ZM10.8 8.9L10.8 19A1.2 1.2 0 0 1 13.2 19L13.2 8.9A1.2 1.2 0 0 1 10.8 8.9ZM13.21 9.053L14.51 19.153A1.2 1.2 0 0 1 16.89 18.847L15.59 8.747A1.2 1.2 0 0 1 13.21 9.053ZM15.638 9.199L18.238 19.299A1.2 1.2 0 0 1 20.562 18.701L17.962 8.601A1.2 1.2 0 0 1 15.638 9.199Z",secondary:"M6.425 8.701L3.825 18.801A0.8 0.8 0 0 1 5.375 19.199L7.975 9.099A0.8 0.8 0 0 1 6.425 8.701ZM8.807 8.798L7.507 18.898A0.8 0.8 0 0 1 9.093 19.102L10.393 9.002A0.8 0.8 0 0 1 8.807 8.798Z"},"swing-horizontal-full":{path:"M3 7.6L21 7.6A1 1 0 0 1 21 5.6L3 5.6A1 1 0 0 1 3 7.6ZM6.038 8.601L3.438 18.701A1.2 1.2 0 0 1 5.762 19.299L8.362 9.199A1.2 1.2 0 0 1 6.038 8.601ZM8.41 8.747L7.11 18.847A1.2 1.2 0 0 1 9.49 19.153L10.79 9.053A1.2 1.2 0 0 1 8.41 8.747ZM10.8 8.9L10.8 19A1.2 1.2 0 0 1 13.2 19L13.2 8.9A1.2 1.2 0 0 1 10.8 8.9ZM13.21 9.053L14.51 19.153A1.2 1.2 0 0 1 16.89 18.847L15.59 8.747A1.2 1.2 0 0 1 13.21 9.053ZM15.638 9.199L18.238 19.299A1.2 1.2 0 0 1 20.562 18.701L17.962 8.601A1.2 1.2 0 0 1 15.638 9.199Z"}},Ot=yt(class extends _t{constructor(t){if(super(t),1!==t.type||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(e=>t[e]).join(" ")+" "}update(t,[e]){if(void 0===this.st){this.st=new Set,void 0!==t.strings&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter(t=>""!==t)));for(const t in e)e[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(e)}const i=t.element.classList;for(const t of this.st)t in e||(i.remove(t),this.st.delete(t));for(const t in e){const s=!!e[t];s===this.st.has(t)||this.nt?.has(t)||(s?(i.add(t),this.st.add(t)):(i.remove(t),this.st.delete(t)))}return V}});try{CSS.registerProperty?.({name:"--dial-color",syntax:"<color>",inherits:!0,initialValue:"transparent"})}catch{}const Zt=["cool","heat","heat_cool","auto","dry","fan_only"],zt=160,Pt=225,Ht=270;function It(t,e){const i=(t-90)*Math.PI/180;return{x:zt+e*Math.cos(i),y:zt+e*Math.sin(i)}}let Tt=class extends nt{constructor(){super(...arguments),this.value=20,this.min=7,this.max=35,this.step=.5,this.mode="off",this.modeLabel="",this.unit="°C",this.showCurrentAsPrimary=!1,this.disabled=!1,this.dual=!1,this._dragging=!1,this._dragValue=0,this._dragLow=0,this._dragHigh=0,this._activeHandle=null,this._onPointerDown=t=>{if(this.disabled||!this._isRingHit(t.clientX,t.clientY))return;t.preventDefault(),this._svg.setPointerCapture(t.pointerId),this._dragging=!0;const e=this._valueFromPoint(t.clientX,t.clientY);this.dual&&(this._dragLow=this._displayLow,this._dragHigh=this._displayHigh,this._activeHandle=Math.abs(e-this._dragLow)<=Math.abs(e-this._dragHigh)?"low":"high"),this._emitFromValue(e)},this._onPointerMove=t=>{this._dragging&&this._emitFromValue(this._valueFromPoint(t.clientX,t.clientY))},this._onPointerUp=t=>{this._dragging&&(this._svg.releasePointerCapture(t.pointerId),this._dragging=!1,this.dual?(this._emit("value-changed",{low:this._dragLow,high:this._dragHigh}),this._activeHandle=null):this._emit("value-changed",{value:this._dragValue}))},this._onKeyDown=t=>{if(this.disabled||this.dual)return;let e;"ArrowUp"===t.key||"ArrowRight"===t.key?e=this.value+this.step:"ArrowDown"!==t.key&&"ArrowLeft"!==t.key||(e=this.value-this.step),void 0!==e&&(t.preventDefault(),this._emit("value-changed",{value:this._roundToStep(e)}))}}get _precision(){return this.step<1?1:0}get _displayValue(){return this._dragging?this._dragValue:this.value}get _displayLow(){return this._dragging?this._dragLow:this.lowValue??this.min}get _displayHigh(){return this._dragging?this._dragHigh:this.highValue??this.max}_angleOf(t){const e=(t-this.min)/(this.max-this.min||1);return Pt+Math.min(1,Math.max(0,e))*Ht}_fracOf(t){return(this._angleOf(t)-Pt)/Ht}_roundToStep(t){const e=Math.min(this.max,Math.max(this.min,t)),i=Math.round(e/this.step)*this.step;return parseFloat(i.toFixed(this._precision))}_isRingHit(t,e){const i=this._svg.getBoundingClientRect(),s=i.width/320||1,a=t-(i.left+i.width/2),o=e-(i.top+i.height/2),r=Math.hypot(a,o)/s;if(r<98||r>152)return!1;let n=180*Math.atan2(o,a)/Math.PI+90;return n=(n%360+360)%360,n>=Pt||n<=135}_valueFromPoint(t,e){const i=this._svg.getBoundingClientRect(),s=i.left+i.width/2,a=i.top+i.height/2;let o,r=180*Math.atan2(e-a,t-s)/Math.PI+90;r=(r%360+360)%360,o=r>=Pt?r-Pt:r<=135?r+360-Pt:r<180?Ht:0;const n=Math.min(1,Math.max(0,o/Ht));return this._roundToStep(this.min+n*(this.max-this.min))}_applyDual(t){"low"===this._activeHandle?this._dragLow=Math.min(t,this._dragHigh-this.step):this._dragHigh=Math.max(t,this._dragLow+this.step)}_emitFromValue(t){this.dual?(this._applyDual(t),this._emit("value-changing",{low:this._dragLow,high:this._dragHigh})):(this._dragValue=t,this._emit("value-changing",{value:t}))}_step(t){this.disabled||this._emit("value-changed",{value:this._roundToStep(this.value+t*this.step)})}_emit(t,e){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}_fmt(t,e){return null==t||Number.isNaN(t)?"—":t.toFixed(e)}_fmtCompact(t){return Number.isInteger(t)?String(t):t.toFixed(1)}_dotOrbit(t,e){return F`<div class="orbit" style=${`transform: rotate(${t}deg)`}>
      <div class="o-dot ${e}"></div>
    </div>`}_labelOrbit(t,e){return F`<div class="orbit" style=${`transform: rotate(${t}deg)`}>
      <div class="o-label" style=${`transform: translate(-50%, -50%) rotate(${-t}deg)`}>
        ${e}
      </div>
    </div>`}render(){const t=!Zt.includes(this.mode),e=t?"var(--mt-on-surface-variant)":Ct(this.mode),i=kt[this.mode]??"mdi:thermostat",s=null!=this.current&&this.current>=this.min&&this.current<=this.max,a=this._angleOf(this._displayValue),o=s?this._angleOf(this.current):0,r=!this.dual&&s&&!t&&Math.abs(a-o)<18;let n=0,l=0,c=!1;this.dual?(n=this._fracOf(this._displayLow),l=this._fracOf(this._displayHigh),c=!0):s&&!t&&(n=Math.min(this._fracOf(this._displayValue),this._fracOf(this.current)),l=Math.max(this._fracOf(this._displayValue),this._fracOf(this.current)),c=!0);const d=function(t,e,i){const s=It(225,i),a=It(495,i);return`M ${s.x} ${s.y} A 130 130 0 1 1 ${a.x} ${a.y}`}(0,0,130),h=`${(1e3*(l-n)).toFixed(2)} 1000`,p=(1e3*-n).toFixed(2),u=F`<span class="num current">${this._fmtCompact(this.current)}°</span>`,m=F`<ha-icon class="mode-icon" icon=${i}></ha-icon>`;return F`
      <div
        class=${Ot({dial:!0,off:t,disabled:this.disabled})}
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
            <radialGradient id="mt-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="var(--dial-color)" stop-opacity="0.38" />
              <stop offset="58%" stop-color="var(--dial-color)" stop-opacity="0.13" />
              <stop offset="100%" stop-color="var(--dial-color)" stop-opacity="0.02" />
            </radialGradient>
          </defs>
          <circle class="glow" cx=${zt} cy=${zt} r="150" fill="url(#mt-glow)" />
          <path class="ring" d=${d} />
          <path
            class="value"
            d=${d}
            pathLength="1000"
            stroke-dasharray=${h}
            stroke-dashoffset=${p}
            style=${"opacity:"+(c?1:0)}
          />
          <path class="hit" d=${d} />
        </svg>

        <div class="markers">
          ${this.dual?F`
                ${this._dotOrbit(this._angleOf(this._displayLow),"setpoint")}
                ${this._dotOrbit(this._angleOf(this._displayHigh),"setpoint")}
                ${s?this._dotOrbit(o,"current"):q}
                ${this._labelOrbit(this._angleOf(this._displayLow),F`<span class="num">${this._fmtCompact(this._displayLow)}°</span>`)}
                ${this._labelOrbit(this._angleOf(this._displayHigh),F`<span class="num">${this._fmtCompact(this._displayHigh)}°</span>`)}
                ${s?this._labelOrbit(o,u):q}
              `:F`
                ${this._dotOrbit(a,"setpoint")}
                ${s?this._dotOrbit(o,"current"):q}
                ${r?this._labelOrbit(o,F`<span class="num current with-icon"
                        ><ha-icon class="mode-icon inline" icon=${i}></ha-icon
                        >${this._fmtCompact(this.current)}°</span
                      >`):F`
                      ${t?q:this._labelOrbit(a,m)}
                      ${s?this._labelOrbit(o,u):q}
                    `}
              `}
        </div>

        ${this.dual?this._renderDualCenter():this._renderSingleCenter()}
        ${this.dual?q:this._renderAdjust()}
      </div>
    `}_renderSingleCenter(){const t=this._displayValue,e=this.showCurrentAsPrimary&&null!=this.current?this.current:t,i=this.showCurrentAsPrimary?1:this._precision;return F`
      <div class="center">
        ${this.modeLabel?F`<div class="mode">${this.modeLabel}</div>`:q}
        <div class="temp">
          <span class="value-text">${this._fmt(e,i)}</span>
          <span class="unit">${this.unit}</span>
        </div>
      </div>
    `}_renderDualCenter(){return F`
      <div class="center">
        ${this.modeLabel?F`<div class="mode">${this.modeLabel}</div>`:q}
        <div class="temp dual">
          <span class="value-text">${this._fmt(this._displayLow,this._precision)}</span>
          <span class="dash">–</span>
          <span class="value-text">${this._fmt(this._displayHigh,this._precision)}</span>
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
    `}};Tt.styles=[Mt,r`
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
          opacity var(--mt-motion-dur) var(--mt-motion-ease);
      }
      .glow {
        transition: opacity var(--mt-motion-dur) var(--mt-motion-ease);
      }
      .dial.off .glow {
        opacity: 0.5;
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
    `],t([pt({type:Number})],Tt.prototype,"value",void 0),t([pt({type:Number})],Tt.prototype,"min",void 0),t([pt({type:Number})],Tt.prototype,"max",void 0),t([pt({type:Number})],Tt.prototype,"step",void 0),t([pt({type:Number})],Tt.prototype,"current",void 0),t([pt()],Tt.prototype,"mode",void 0),t([pt()],Tt.prototype,"modeLabel",void 0),t([pt()],Tt.prototype,"unit",void 0),t([pt({type:Boolean})],Tt.prototype,"showCurrentAsPrimary",void 0),t([pt({type:Boolean})],Tt.prototype,"disabled",void 0),t([pt({type:Boolean})],Tt.prototype,"dual",void 0),t([pt({type:Number})],Tt.prototype,"lowValue",void 0),t([pt({type:Number})],Tt.prototype,"highValue",void 0),t([ut()],Tt.prototype,"_dragging",void 0),t([ut()],Tt.prototype,"_dragValue",void 0),t([ut()],Tt.prototype,"_dragLow",void 0),t([ut()],Tt.prototype,"_dragHigh",void 0),t([ut()],Tt.prototype,"_activeHandle",void 0),t([(t,e,i)=>((t,e,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof e&&Object.defineProperty(t,e,i),i))(t,e,{get(){return t=this,t.renderRoot?.querySelector("svg")??null;var t}})],Tt.prototype,"_svg",void 0),Tt=t([ct("mt-circular-dial")],Tt);let jt=class extends nt{constructor(){super(...arguments),this.items=[],this.placeholder="",this._open=!1,this._up=!1,this._onDocClick=t=>{this._open&&!t.composedPath().includes(this)&&(this._open=!1)}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onDocClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onDocClick)}get _active(){return this.items.find(t=>t.active)??this.items[0]}_toggle(t){if(t.stopPropagation(),!this._open){const t=this.getBoundingClientRect();this._up=t.bottom>.55*window.innerHeight}this._open=!this._open}_select(t,e){t.stopPropagation(),this._open=!1,this.dispatchEvent(new CustomEvent("item-selected",{detail:{value:e}}))}render(){const t=this._active;return F`
      <button
        class=${Ot({trigger:!0,open:this._open})}
        aria-haspopup="listbox"
        aria-expanded=${this._open?"true":"false"}
        @click=${this._toggle}
      >
        ${t?.icon?F`<ha-icon class="lead" icon=${t.icon}></ha-icon>`:F`<span class="dot"></span>`}
        <span class="label">${t?.label??this.placeholder}</span>
        <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
      </button>
      ${this._open?F`<div class=${Ot({menu:!0,up:this._up})} role="listbox">
            ${this.items.map(t=>F`<button
                class=${Ot({opt:!0,active:!!t.active})}
                role="option"
                aria-selected=${t.active?"true":"false"}
                @click=${e=>this._select(e,t.value)}
              >
                ${t.icon?F`<ha-icon icon=${t.icon}></ha-icon>`:F`<span class="dot"></span>`}
                <span class="label">${t.label}</span>
                ${t.active?F`<ha-icon class="check" icon="mdi:check"></ha-icon>`:q}
              </button>`)}
          </div>`:q}
    `}};jt.styles=[Mt,r`
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
    `],t([pt({attribute:!1})],jt.prototype,"items",void 0),t([pt()],jt.prototype,"placeholder",void 0),t([ut()],jt.prototype,"_open",void 0),t([ut()],jt.prototype,"_up",void 0),jt=t([ct("mt-dropdown")],jt);let Ut=class extends nt{constructor(){super(...arguments),this.items=[],this.display="icons"}_select(t){this.dispatchEvent(new CustomEvent("item-selected",{detail:{value:t},bubbles:!0,composed:!0}))}render(){return this.items.length?"dropdown"===this.display?this._renderDropdown():this._renderIcons():q}_renderIcons(){return F`
      <div class="row">
        ${this.label?F`<span class="row-label">${this.label}</span>`:q}
        <div class="chips" role="group" aria-label=${this.label??"options"}>
          ${this.items.map(t=>F`
              <button
                class=${Ot({chip:!0,active:!!t.active})}
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
    ></mt-dropdown>`}};Ut.styles=[Mt,r`
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
           rounded container. Icons keep one internal unit each (2 sections-grid
           units) on a single row; when they don't all fit, the row scrolls
           horizontally (clipped to the rounded shape) instead of squishing. */
        min-width: 0;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
      }
      .chips::-webkit-scrollbar {
        display: none;
      }
      .chip {
        /* Footprint (44px + 4px gap) = one internal unit (= 2 sections-grid
           units), so N icons fit exactly N internal units. Grow to fill, capped
           so icons never over-stretch when there is spare room. */
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
    `],t([pt({attribute:!1})],Ut.prototype,"items",void 0),t([pt()],Ut.prototype,"display",void 0),t([pt()],Ut.prototype,"label",void 0),Ut=t([ct("mt-selector-row")],Ut);let Dt=class extends nt{constructor(){super(...arguments),this.kind="hvac",this.display="icons"}get _stateObj(){return this.hass?.states?.[this.entityId]}_overrideMap(){const t=new Map;return(this.options??[]).forEach(e=>t.set(e.value,e)),t}_build(){const t=this._stateObj;if(!t)return[];const e=this._overrideMap();let i,s,a=[];return"hvac"===this.kind?(a=t.attributes.hvac_modes??[],i=t.state,s=t=>kt[t]??"mdi:thermostat"):"fan"===this.kind?(a=t.attributes.fan_modes??[],i=t.attributes.fan_mode,s=t=>function(t){const e=t.toLowerCase();return e.includes("auto")?"mdi:fan-auto":e.includes("off")||"0"===e?"mdi:fan-off":/(^|[^0-9])1([^0-9]|$)|low|min|quiet|silent/.test(e)?"mdi:fan-speed-1":/(^|[^0-9])2([^0-9]|$)|mid|med/.test(e)?"mdi:fan-speed-2":/(^|[^0-9])3([^0-9]|$)|high|max|strong|turbo/.test(e)?"mdi:fan-speed-3":"mdi:fan"}(t)):(a=t.attributes.swing_modes??[],i=t.attributes.swing_mode,s=t=>function(t){const e=t.toLowerCase();return"off"===e||"stop"===e||"fixed"===e?"mdi:arrow-expand-vertical":"both"===e||"on"===e||"full"===e?"mdi:arrow-all":e.includes("horizontal")?"mdi:arrow-left-right":e.includes("vertical")?"mdi:arrow-up-down":"mdi:swap-vertical"}(t)),a.filter(t=>!e.get(t)?.hide).map(t=>({value:t,label:e.get(t)?.label??St(t),icon:e.get(t)?.icon??s(t),active:t===i}))}_onSelect(t){const e=t.detail.value;if(!this._stateObj)return;const i=this.entityId;"hvac"===this.kind?this.hass.callService("climate","set_hvac_mode",{entity_id:i,hvac_mode:e}):"fan"===this.kind?this.hass.callService("climate","set_fan_mode",{entity_id:i,fan_mode:e}):this.hass.callService("climate","set_swing_mode",{entity_id:i,swing_mode:e})}render(){const t=this._build();return t.length?F`
      <mt-selector-row
        .items=${t}
        display=${this.display}
        @item-selected=${this._onSelect}
      ></mt-selector-row>
    `:q}};t([pt({attribute:!1})],Dt.prototype,"hass",void 0),t([pt()],Dt.prototype,"entityId",void 0),t([pt()],Dt.prototype,"kind",void 0),t([pt()],Dt.prototype,"display",void 0),t([pt({attribute:!1})],Dt.prototype,"options",void 0),Dt=t([ct("mt-climate-selector")],Dt);let Rt=class extends nt{constructor(){super(...arguments),this.display="icons"}get _stateObj(){return this.hass?.states?.[this.entity]}_overrideMap(){const t=new Map;return(this.options??[]).forEach(e=>t.set(e.value,e)),t}_build(){const t=this._stateObj;if(!t)return[];const e=this._overrideMap();return(t.attributes.options??[]).filter(t=>!e.get(t)?.hide).map(i=>({value:i,label:e.get(i)?.label??St(i),icon:e.get(i)?.icon,active:i===t.state}))}_onSelect(t){this._stateObj&&this.hass.callService("input_select","select_option",{entity_id:this.entity,option:t.detail.value})}render(){const t=this._build();return t.length?F`<mt-selector-row
      .items=${t}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:q}};t([pt({attribute:!1})],Rt.prototype,"hass",void 0),t([pt()],Rt.prototype,"entity",void 0),t([pt()],Rt.prototype,"display",void 0),t([pt()],Rt.prototype,"label",void 0),t([pt({attribute:!1})],Rt.prototype,"options",void 0),Rt=t([ct("mt-input-select")],Rt);let Nt=class extends nt{constructor(){super(...arguments),this.entities=[],this.display="icons"}_build(){return(this.entities??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon,active:"on"===e?.state,disabled:!e||"unavailable"===e.state}})}async _onSelect(t){const e=t.detail.value,i=(this.entities??[]).map(t=>t.entity).filter(t=>t&&t!==e&&"on"===this.hass.states[t]?.state);i.length&&await this.hass.callService("homeassistant","turn_off",{entity_id:i}),await this.hass.callService("homeassistant","turn_on",{entity_id:e})}render(){const t=this._build();return t.length?F`<mt-selector-row
      .items=${t}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:q}};t([pt({attribute:!1})],Nt.prototype,"hass",void 0),t([pt({attribute:!1})],Nt.prototype,"entities",void 0),t([pt()],Nt.prototype,"display",void 0),t([pt()],Nt.prototype,"label",void 0),Nt=t([ct("mt-switch-group")],Nt);let Ft=class extends nt{constructor(){super(...arguments),this.entities=[]}_build(){return(this.entities??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon??"mdi:toggle-switch-variant",active:"on"===e?.state,disabled:!e||"unavailable"===e.state}})}_onSelect(t){this.hass.callService("homeassistant","toggle",{entity_id:t.detail.value})}render(){const t=this._build();return t.length?F`<mt-selector-row
      .items=${t}
      display="icons"
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:q}};function Vt(t,e,i){switch(i.split(".")[0]){case"button":e.callService("button","press",{entity_id:i});break;case"input_button":e.callService("input_button","press",{entity_id:i});break;case"scene":e.callService("scene","turn_on",{entity_id:i});break;case"script":e.callService("script","turn_on",{entity_id:i});break;case"switch":case"light":case"fan":case"input_boolean":e.callService("homeassistant","toggle",{entity_id:i});break;default:gt(t,"hass-more-info",{entityId:i})}}t([pt({attribute:!1})],Ft.prototype,"hass",void 0),t([pt({attribute:!1})],Ft.prototype,"entities",void 0),t([pt()],Ft.prototype,"label",void 0),Ft=t([ct("mt-switch-list")],Ft);let qt=class extends nt{constructor(){super(...arguments),this.items=[]}_build(){return(this.items??[]).filter(t=>t.entity).map(t=>{const e=this.hass?.states?.[t.entity];return{value:t.entity,label:t.label??e?.attributes.friendly_name??t.entity,icon:t.icon??e?.attributes.icon??"mdi:gesture-tap-button",active:!1,disabled:!e||"unavailable"===e.state}})}_onSelect(t){Vt(this,this.hass,t.detail.value)}render(){const t=this._build();return t.length?F`<mt-selector-row
      .items=${t}
      display="icons"
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mt-selector-row>`:q}};t([pt({attribute:!1})],qt.prototype,"hass",void 0),t([pt({attribute:!1})],qt.prototype,"items",void 0),t([pt()],qt.prototype,"label",void 0),qt=t([ct("mt-button-list")],qt);const Bt={sensor:"mdi:gauge",binary_sensor:"mdi:radiobox-marked",switch:"mdi:toggle-switch-variant",light:"mdi:lightbulb",fan:"mdi:fan",button:"mdi:gesture-tap-button",input_button:"mdi:gesture-tap-button",scene:"mdi:palette",script:"mdi:script-text"};let Wt=class extends nt{constructor(){super(...arguments),this._tap=()=>{this.config.entity&&function(t,e,i,s){const a=s??{action:"default"};switch(a.action){case"none":return;case"more-info":return void gt(t,"hass-more-info",{entityId:a.entity??i});case"toggle":return void e.callService("homeassistant","toggle",{entity_id:i});case"url":return void(a.url_path&&window.open(a.url_path));case"navigate":return void(a.navigation_path&&(window.history.pushState(null,"",a.navigation_path),gt(t,"location-changed",{replace:!1})));case"call-service":case"perform-action":{const t=a.perform_action??a.service;if(!t||!t.includes("."))return;const[i,s]=t.split(".");return void e.callService(i,s,a.data??a.service_data??{},a.target)}default:Vt(t,e,i)}}(this,this.hass,this.config.entity,this.config.tap_action)}}get _stateObj(){return this.hass?.states?.[this.config.entity]}get _isOn(){return"on"===this._stateObj?.state}_secondary(){const t=this._stateObj;if(!t)return;const e=this.config.entity.split(".")[0];if("sensor"===e){const e=t.attributes.unit_of_measurement;return e?`${t.state} ${e}`:t.state}return["switch","light","fan","input_boolean","binary_sensor"].includes(e)?this._isOn?"On":"Off":["button","input_button","scene","script"].includes(e)?void 0:t.state}render(){if(!this.config?.entity)return q;const t=this._stateObj,e=this.config.entity.split(".")[0],i=this.config.name??t?.attributes.friendly_name??this.config.entity,s=this.config.icon??t?.attributes.icon??Bt[e]??"mdi:eye",a=this._secondary(),o=this.config.width,r=1===o,n=this.config.compact||"number"==typeof o&&o<=2;return r?F`
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
          ${a?F`<div class="val">${a}</div>`:q}
        </button>
      `:F`
      <button class="tile" @click=${this._tap} aria-label=${i}>
        <div class="ic ${this._isOn?"on":""}"><ha-icon icon=${s}></ha-icon></div>
        <div class="text">
          <div class="title">${i}</div>
          ${a?F`<div class="sub">${a}</div>`:q}
        </div>
      </button>
    `}};Wt.styles=[Mt,r`
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
    `],t([pt({attribute:!1})],Wt.prototype,"hass",void 0),t([pt({attribute:!1})],Wt.prototype,"config",void 0),Wt=t([ct("mt-entity-tile")],Wt);let Kt=class extends nt{willUpdate(t){if(!t.has("feature")||!this.feature)return;const e=this.feature,i="number"==typeof e.width&&e.width>0?e.width:void 0;if(i){const t=Lt(i);this.style.flex=`0 0 ${t}px`,this.style.maxWidth="100%"}else if("entity-tile"===e.type){const t=Lt(e.compact?2:3);this.style.flex=`1 1 ${t}px`,this.style.maxWidth=e.compact?`${t}px`:"none"}else this.style.flex="1 1 100%",this.style.maxWidth="none"}render(){const t=this.feature;switch(t.type){case"climate-hvac-modes":case"climate-fan-modes":case"climate-swing-modes":{const e="climate-hvac-modes"===t.type?"hvac":"climate-fan-modes"===t.type?"fan":"swing";return F`<mt-climate-selector
          .hass=${this.hass}
          entityId=${this.entityId}
          kind=${e}
          display=${t.display??"icons"}
          .options=${t.options}
        ></mt-climate-selector>`}case"input-select":return F`<mt-input-select
          .hass=${this.hass}
          entity=${t.entity}
          display=${t.display??"icons"}
          .label=${t.label}
          .options=${t.options}
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
        ></mt-button-list>`;case"entity-tile":return F`<mt-entity-tile .hass=${this.hass} .config=${t}></mt-entity-tile>`;default:return q}}};Kt.styles=r`
    :host {
      display: block;
      /* allow shrinking below content so a wide icon list wraps/scrolls inside
         its column instead of overflowing the card */
      min-width: 0;
    }
  `,t([pt({attribute:!1})],Kt.prototype,"hass",void 0),t([pt()],Kt.prototype,"entityId",void 0),t([pt({attribute:!1})],Kt.prototype,"feature",void 0),Kt=t([ct("mt-feature-row")],Kt),function(){const t=window;t.customIcons=t.customIcons||{},t.customIcons.mt||(t.customIcons.mt={getIcon:async t=>{const e=Et[t];if(!e)throw new Error(`Unknown mt icon: mt:${t}`);return e.secondary?{path:e.path,secondaryPath:e.secondary}:{path:e.path}}})}(),console.info("%c MATERIAL-THERMOSTAT-CARD %c v0.5.0 ","color: white; background: #6750a4; font-weight: 700;","color: #6750a4; background: white; font-weight: 700;"),window.customCards=window.customCards||[],window.customCards.push({type:xt,name:"Material Thermostat Card",description:"A Material 3 Expressive thermostat card with customizable selectors and Nest/Google Home inspired UI.",preview:!0,documentationURL:"https://github.com/lageorgem/ha-material-thermostat-card"});let Yt=class extends nt{constructor(){super(...arguments),this._widthPx=0}static async getConfigElement(){return await Promise.resolve().then(function(){return de}),document.createElement(At)}static getStubConfig(t){const e=Object.keys(t.states).find(t=>t.startsWith("climate."))??"";return{type:`custom:${xt}`,entity:e,features:[{type:"climate-hvac-modes"}]}}setConfig(t){if(!t.entity||"climate"!==t.entity.split(".")[0])throw new Error("You must specify a climate entity.");this._config=t}getCardSize(){return 7+(this._config?.features?.length??0)}get _stateObj(){return this.hass?.states?.[this._config?.entity]}_trackedEntityIds(){const t=new Set([this._config.entity]);for(const e of this._config.features??[])"entity"in e&&e.entity&&t.add(e.entity),"entities"in e&&e.entities?.forEach(e=>t.add(e.entity)),"items"in e&&e.items?.forEach(e=>t.add(e.entity));return[...t]}shouldUpdate(t){if(t.has("_config")||t.has("_selectedTemp")||t.has("_selectedLow")||t.has("_selectedHigh")||t.has("_widthPx"))return!0;if(!this._config)return!1;if(t.has("hass")){const e=t.get("hass");return!e||this._trackedEntityIds().some(t=>e.states[t]!==this.hass.states[t])}return!1}updated(t){if(t.has("hass")||t.has("_config")){const e=t.get("hass");!this._config?.theme||e&&e.themes===this.hass.themes&&!t.has("_config")||function(t,e,i,s){void 0===s&&(s=!1),t._themes||(t._themes={});var a=e.default_theme;("default"===i||i&&e.themes[i])&&(a=i);var o=vt({},t._themes);if("default"!==a){var r=e.themes[a];Object.keys(r).forEach(function(e){var i="--"+e;t._themes[i]="",o[i]=r[e]})}if(t.updateStyles?t.updateStyles(o):window.ShadyCSS&&window.ShadyCSS.styleSubtree(t,o),s){var n=document.querySelector("meta[name=theme-color]");if(n){n.hasAttribute("default-content")||n.setAttribute("default-content",n.getAttribute("content"));var l=o["--primary-color"]||n.getAttribute("default-content");n.setAttribute("content",l)}}}(this,this.hass.themes,this._config.theme)}if(t.has("hass")){const t=this._stateObj?.attributes;null!=this._selectedTemp&&t?.temperature===this._selectedTemp&&(this._selectedTemp=void 0),null!=this._selectedLow&&t?.target_temp_low===this._selectedLow&&(this._selectedLow=void 0),null!=this._selectedHigh&&t?.target_temp_high===this._selectedHigh&&(this._selectedHigh=void 0)}}_observeWidth(){this._resizeObserver||"undefined"==typeof ResizeObserver||(this._resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect.width??0,i=Math.max(0,e-32);Math.abs(i-this._widthPx)>=1&&(this._widthPx=i)}),this._resizeObserver.observe(this))}connectedCallback(){super.connectedCallback(),this._observeWidth()}_visibleCount(t,e){if(!t?.length)return 0;if(!e?.length)return t.length;const i=new Set(e.filter(t=>t.hide).map(t=>t.value));return t.filter(t=>!i.has(t)).length}_featureUnits(t){if("width"in t&&"number"==typeof t.width&&t.width>0)return t.width;const e=this._stateObj?.attributes;switch(t.type){case"climate-hvac-modes":return"dropdown"===t.display?4:this._visibleCount(e?.hvac_modes,t.options);case"climate-fan-modes":return"dropdown"===t.display?4:this._visibleCount(e?.fan_modes,t.options);case"climate-swing-modes":return"dropdown"===t.display?4:this._visibleCount(e?.swing_modes,t.options);case"input-select":return"dropdown"===t.display?4:this._visibleCount(this.hass.states[t.entity]?.attributes?.options,t.options);case"switch-group":return"dropdown"===t.display?4:t.entities?.length??0;case"switch-list":return t.entities?.length??0;case"button-list":return t.items?.length??0;case"entity-tile":return 6;default:return 0}}_maxFeatureUnits(){const t=this._config.features??[];return t.length?Math.max(1,...t.map(t=>this._featureUnits(t))):0}_layout(){const t=this._config.features??[],e=Math.min(18,Math.max(1,Math.floor(this._widthPx/48)));if(!(this._widthPx>0&&t.length>0&&e>=12))return{wide:!1,dialStyle:{},featureStyle:{}};let i=Math.min(this._maxFeatureUnits(),9),s=Math.max(6,i);for(;s+i>e&&i>1;)i-=1,s=Math.max(6,i);const a=24*(s-6);return{wide:!0,dialStyle:{flex:`0 0 ${Lt(s)}px`,paddingInline:`${a}px`},featureStyle:{flex:`0 0 ${Lt(i)}px`}}}get _isDual(){const t=this._stateObj?.attributes;return"heat_cool"===this._stateObj?.state&&null!=t?.target_temp_low&&null!=t?.target_temp_high}get _targetTemp(){return this._selectedTemp??this._stateObj?.attributes.temperature}get _targetLow(){return this._selectedLow??this._stateObj?.attributes.target_temp_low}get _targetHigh(){return this._selectedHigh??this._stateObj?.attributes.target_temp_high}_scheduleCommit(){this._debounceTimer&&window.clearTimeout(this._debounceTimer),this._debounceTimer=window.setTimeout(()=>{const t={entity_id:this._config.entity};this._isDual?(t.target_temp_low=this._targetLow,t.target_temp_high=this._targetHigh):t.temperature=this._targetTemp,this.hass.callService("climate","set_temperature",t)},600)}_onChanging(t){const{value:e,low:i,high:s}=t.detail;null!=i||null!=s?(this._selectedLow=i,this._selectedHigh=s):this._selectedTemp=e}_onChanged(t){this._onChanging(t),this._scheduleCommit()}_showMoreInfo(){gt(this,"hass-more-info",{entityId:this._config.entity})}_colorMode(){const t=this._stateObj?.attributes;switch(t?.hvac_action){case"cooling":return"cool";case"heating":return"heat";case"drying":return"dry";case"fan":return"fan_only";default:return this._stateObj?.state??"off"}}render(){if(!this._config||!this.hass)return F``;const t=this._stateObj;if(!t)return F`<ha-card
        ><div class="error">Entity not found: ${this._config.entity}</div></ha-card
      >`;const e=t.attributes,i=this._config.name??e.friendly_name??this._config.entity,s="unavailable"===t.state||"unknown"===t.state,a=this.hass.config?.unit_system?.temperature??"°C",o=this._colorMode(),r=this._layout();return F`
      <ha-card style=${`--mt-active-color: ${Ct(o)}`}>
        <div class="header">
          <div class="name" title=${i}>${i}</div>
          <button class="more" aria-label="More information" @click=${this._showMoreInfo}>
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </button>
        </div>

        <div class=${"body "+(r.wide?"wide":"stacked")}>
          <div class="dial-wrap" style=${wt(r.dialStyle)}>
            <mt-circular-dial
              .value=${this._targetTemp??e.min_temp??20}
              .min=${e.min_temp??7}
              .max=${e.max_temp??35}
              .step=${e.target_temp_step??.5}
              .current=${e.current_temperature}
              .mode=${o}
              .modeLabel=${s?"Unavailable":St(t.state)}
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

          ${this._config.features?.length?F`<div class="features" style=${wt(r.featureStyle)}>
                ${this._config.features.map(t=>F`<mt-feature-row
                    .hass=${this.hass}
                    .entityId=${this._config.entity}
                    .feature=${t}
                  ></mt-feature-row>`)}
              </div>`:q}
        </div>
      </ha-card>
    `}disconnectedCallback(){super.disconnectedCallback(),this._debounceTimer&&window.clearTimeout(this._debounceTimer),this._resizeObserver?.disconnect(),this._resizeObserver=void 0}};Yt.styles=[Mt,r`
      :host {
        display: block;
      }
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
      .body {
        display: flex;
        margin-top: 8px;
      }
      /* Stacked (narrow): controls above a full-width feature area. */
      .body.stacked {
        flex-direction: column;
        gap: 16px;
      }
      /* Side-by-side (wide): dial and feature columns, centered as a block so
         neither over-stretches; column widths are set inline in internal units. */
      .body.wide {
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 24px;
      }
      .dial-wrap {
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        min-width: 0;
      }
      .features {
        box-sizing: border-box;
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        gap: 10px;
        min-width: 0;
      }
      .error {
        padding: 24px;
        text-align: center;
        color: var(--mt-error);
      }
    `],t([pt({attribute:!1})],Yt.prototype,"hass",void 0),t([ut()],Yt.prototype,"_config",void 0),t([ut()],Yt.prototype,"_selectedTemp",void 0),t([ut()],Yt.prototype,"_selectedLow",void 0),t([ut()],Yt.prototype,"_selectedHigh",void 0),t([ut()],Yt.prototype,"_widthPx",void 0),Yt=t([ct(xt)],Yt);let Gt=class extends nt{constructor(){super(...arguments),this.value="icons"}_set(t){t!==this.value&&this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t},bubbles:!0,composed:!0}))}render(){return F`
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
    `}};Gt.styles=r`
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
  `,t([pt()],Gt.prototype,"value",void 0),Gt=t([ct("mt-display-toggle")],Gt);const Xt=[{name:"width",selector:{number:{min:1,max:18,step:1,mode:"box"}}}];let Jt=class extends nt{constructor(){super(...arguments),this._computeLabel=()=>"Width (grid units, 1 = one icon)"}_changed(t){const e=t.detail.value?.width;this.dispatchEvent(new CustomEvent("width-changed",{detail:{value:"number"==typeof e?e:void 0},bubbles:!0,composed:!0}))}render(){return F`<ha-form
      .hass=${this.hass}
      .data=${{width:this.value}}
      .schema=${Xt}
      .computeLabel=${this._computeLabel}
      @value-changed=${this._changed}
    ></ha-form>`}};t([pt({attribute:!1})],Jt.prototype,"hass",void 0),t([pt({type:Number})],Jt.prototype,"value",void 0),Jt=t([ct("mt-width-field")],Jt);let Qt=class extends nt{_values(){const t=this.hass?.states?.[this.entityId]?.attributes;return t?"hvac"===this.kind?t.hvac_modes??[]:"fan"===this.kind?t.fan_modes??[]:t.swing_modes??[]:[]}_override(t){return this.feature.options?.find(e=>e.value===t)}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setOverride(t,e){const i=[...this.feature.options??[]],s=i.findIndex(e=>e.value===t),a={...s>=0?i[s]:{value:t},...e};""===a.label&&delete a.label,""===a.icon&&delete a.icon,a.hide||delete a.hide;const o=void 0!==a.label||void 0!==a.icon||!!a.hide;s>=0?o?i[s]=a:i.splice(s,1):o&&i.push(a),this._emit({options:i})}render(){const t=this._values(),e=this.feature.display??"icons";return F`
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
            </p>`:F`<div class="options">
              ${t.map(t=>this._renderOption(t))}
            </div>`}
      </div>
    `}_renderOption(t){const e=this._override(t),i=!!e?.hide;return F`
      <div class="opt">
        <div class="opt-name" title=${t}>${St(t)}</div>
        <ha-textfield
          class="opt-label"
          label="Label"
          .value=${e?.label??""}
          .placeholder=${St(t)}
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
    `}};Qt.styles=r`
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
  `,t([pt({attribute:!1})],Qt.prototype,"hass",void 0),t([pt()],Qt.prototype,"entityId",void 0),t([pt()],Qt.prototype,"kind",void 0),t([pt({attribute:!1})],Qt.prototype,"feature",void 0),Qt=t([ct("mt-climate-feature-editor")],Qt);let te=class extends nt{_values(){return this.hass?.states?.[this.feature.entity]?.attributes?.options??[]}_override(t){return this.feature.options?.find(e=>e.value===t)}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setOverride(t,e){const i=[...this.feature.options??[]],s=i.findIndex(e=>e.value===t),a={...s>=0?i[s]:{value:t},...e};""===a.label&&delete a.label,""===a.icon&&delete a.icon,a.hide||delete a.hide;const o=void 0!==a.label||void 0!==a.icon||!!a.hide;s>=0?o?i[s]=a:i.splice(s,1):o&&i.push(a),this._emit({options:i})}render(){const t=this._values(),e=this.feature.display??"icons";return F`
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

        ${0===t.length?F`<p class="hint">Pick an input_select entity to customize its options.</p>`:F`<div class="options">
              ${t.map(t=>{const e=this._override(t),i=!!e?.hide;return F`<div class="opt">
                  <div class="opt-name" title=${t}>${St(t)}</div>
                  <ha-textfield
                    label="Label"
                    .value=${e?.label??""}
                    .placeholder=${St(t)}
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
    `}};te.styles=r`
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
  `,t([pt({attribute:!1})],te.prototype,"hass",void 0),t([pt({attribute:!1})],te.prototype,"feature",void 0),te=t([ct("mt-input-select-editor")],te);let ee=class extends nt{constructor(){super(...arguments),this.itemsKey="entities",this.showDisplay=!1}get _items(){return this.feature[this.itemsKey]??[]}_emit(t){this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{...this.feature,...t}},bubbles:!0,composed:!0}))}_setItems(t){this._emit({[this.itemsKey]:t})}_updateItem(t,e){const i=[...this._items],s={...i[t],...e};""===s.label&&delete s.label,""===s.icon&&delete s.icon,i[t]=s,this._setItems(i)}_addItem(){this._setItems([...this._items,{entity:""}])}_removeItem(t){const e=[...this._items];e.splice(t,1),this._setItems(e)}render(){const t=this.feature.display??"icons";return F`
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
            </div>`:q}

        <mt-width-field
          .hass=${this.hass}
          .value=${this.feature.width}
          @width-changed=${t=>this._emit({width:t.detail.value})}
        ></mt-width-field>

        <div class="items">
          ${this._items.map((t,e)=>F`<div class="item">
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
    `}};ee.styles=r`
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
  `,t([pt({attribute:!1})],ee.prototype,"hass",void 0),t([pt({attribute:!1})],ee.prototype,"feature",void 0),t([pt()],ee.prototype,"itemsKey",void 0),t([pt({type:Boolean})],ee.prototype,"showDisplay",void 0),t([pt({attribute:!1})],ee.prototype,"includeDomains",void 0),ee=t([ct("mt-entity-list-editor")],ee);const ie=[{name:"entity",selector:{entity:{}}},{name:"name",selector:{text:{}}},{name:"icon",selector:{icon:{}}},{name:"compact",selector:{boolean:{}}},{name:"width",selector:{number:{min:1,max:18,step:1,mode:"box"}}},{name:"tap_action",selector:{ui_action:{}}}];let se,ae=class extends nt{constructor(){super(...arguments),this._computeLabel=t=>{switch(t.name){case"entity":return"Entity";case"name":return"Name (optional)";case"icon":return"Icon (optional)";case"compact":return"Compact (icon + value only)";case"width":return"Width (grid units, 1 = one icon)";case"tap_action":return"Tap action";default:return t.name}}}get _data(){return{entity:this.feature.entity,name:this.feature.name,icon:this.feature.icon,compact:this.feature.compact??!1,width:this.feature.width,tap_action:this.feature.tap_action}}_changed(t){const e=t.detail.value;this.dispatchEvent(new CustomEvent("feature-changed",{detail:{feature:{type:"entity-tile",entity:e.entity,name:e.name||void 0,icon:e.icon||void 0,compact:e.compact||void 0,width:e.width||void 0,tap_action:e.tap_action||void 0}},bubbles:!0,composed:!0}))}render(){return F`<ha-form
      .hass=${this.hass}
      .data=${this._data}
      .schema=${ie}
      .computeLabel=${this._computeLabel}
      @value-changed=${this._changed}
    ></ha-form>`}};t([pt({attribute:!1})],ae.prototype,"hass",void 0),t([pt({attribute:!1})],ae.prototype,"feature",void 0),ae=t([ct("mt-entity-tile-editor")],ae);const oe=[{name:"entity",selector:{entity:{domain:"climate"}}},{name:"name",selector:{text:{}}},{name:"theme",selector:{theme:{}}},{name:"show_current_as_primary",selector:{boolean:{}}}],re=[{type:"climate-hvac-modes",label:"Climate HVAC modes"},{type:"climate-fan-modes",label:"Climate fan modes"},{type:"climate-swing-modes",label:"Climate swing modes"},{type:"input-select",label:"Input select"},{type:"switch-group",label:"Switch group"},{type:"switch-list",label:"Switch list"},{type:"button-list",label:"Button list"},{type:"entity-tile",label:"Entity tile"}];function ne(t){switch(t){case"input-select":case"entity-tile":return{type:t,entity:""};case"switch-group":case"switch-list":return{type:t,entities:[]};case"button-list":return{type:t,items:[]};default:return{type:t}}}const le={"climate-hvac-modes":"Climate HVAC modes","climate-fan-modes":"Climate fan modes","climate-swing-modes":"Climate swing modes","input-select":"Input select","switch-group":"Switch group","switch-list":"Switch list","button-list":"Button list","entity-tile":"Entity tile"};let ce=class extends nt{constructor(){super(...arguments),this._editingIndex=null,this._addOpen=!1,this._computeLabel=t=>{switch(t.name){case"entity":return"Climate entity (required)";case"name":return"Name";case"theme":return"Theme";case"show_current_as_primary":return"Show current temperature as primary information";default:return t.name}}}connectedCallback(){super.connectedCallback(),(se||(se=(async()=>{if(customElements.get("ha-form")&&customElements.get("ha-entity-picker")&&customElements.get("ha-icon-picker"))return;const t=window.loadCardHelpers;if(t)try{const e=await t(),i=await e.createCardElement({type:"entities",entities:[]}),s=i?.constructor;s?.getConfigElement&&await s.getConfigElement()}catch{}})(),se)).then(()=>this.requestUpdate())}setConfig(t){this._config=t}get _baseData(){return{entity:this._config.entity,name:this._config.name,theme:this._config.theme,show_current_as_primary:this._config.show_current_as_primary??!1}}_emit(t){this._config=t,gt(this,"config-changed",{config:t})}_baseChanged(t){const e=t.detail.value,i={...this._config,entity:e.entity,name:e.name||void 0,theme:e.theme||void 0,show_current_as_primary:e.show_current_as_primary||void 0};this._emit(i)}get _features(){return this._config.features??[]}_setFeatures(t){this._emit({...this._config,features:t})}_pickFeature(t){this._addOpen=!1;const e=[...this._features,ne(t)];this._editingIndex=e.length-1,this._setFeatures(e)}_removeFeature(t){const e=[...this._features];e.splice(t,1),this._editingIndex=null,this._setFeatures(e)}_moveFeature(t){const{oldIndex:e,newIndex:i}=t.detail,s=[...this._features],[a]=s.splice(e,1);s.splice(i,0,a),this._editingIndex=null,this._setFeatures(s)}_featureChanged(t,e){const i=[...this._features];i[t]=e.detail.feature,this._setFeatures(i)}render(){return this._config&&this.hass?F`
      <div class="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._baseData}
          .schema=${oe}
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
                ${re.map(t=>F`<button class="add-opt" @click=${()=>this._pickFeature(t.type)}>
                    ${t.label}
                  </button>`)}
              </div>`:q}
        </div>
      </div>
    `:F``}_renderFeatureRow(t,e){const i=this._editingIndex===e;return F`
      <div class="feature">
        <div class="feature-head">
          <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
          <div class="feature-title">${le[t.type]??t.type}</div>
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
        ${i?this._renderFeatureEditor(t,e):q}
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
        ></mt-entity-tile-editor>`;break;default:s=F`<p class="hint">No editor available.</p>`}return F`<div class="feature-editor">${s}</div>`}};ce.styles=r`
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
  `,t([pt({attribute:!1})],ce.prototype,"hass",void 0),t([ut()],ce.prototype,"_config",void 0),t([ut()],ce.prototype,"_editingIndex",void 0),t([ut()],ce.prototype,"_addOpen",void 0),ce=t([ct(At)],ce);var de=Object.freeze({__proto__:null,get MaterialThermostatCardEditor(){return ce}});export{Yt as MaterialThermostatCard};
