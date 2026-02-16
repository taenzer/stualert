export function Flash(props: { active?: boolean; size?: number }) {
  return (
    <svg
      id="Ebene_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      width="5em"
      height="5em"
      viewBox="0 0 1000 1000"
    >
      <g
        class={
          "fill-warning " + (props.active ? "animate-pulse" : " opacity-0")
        }
      >
        <rect
          class="st0"
          x="465.5"
          y="191.7"
          width="61.6"
          height="204.7"
          rx="30.8"
          ry="30.8"
        />
        <rect
          class="st0"
          x="611.7"
          y="231.2"
          width="61.6"
          height="204.7"
          rx="30.8"
          ry="30.8"
          transform="translate(148.2 -195.4) rotate(19.5)"
        />
        <rect
          class="st0"
          x="757.9"
          y="292.2"
          width="61.6"
          height="204.7"
          rx="30.8"
          ry="30.8"
          transform="translate(421.2 -407.1) rotate(38.8)"
        />
        <rect
          class="st0"
          x="319.3"
          y="231.2"
          width="61.6"
          height="204.7"
          rx="30.8"
          ry="30.8"
          transform="translate(791.5 531.2) rotate(160.5)"
        />
        <rect
          class="st0"
          x="173.1"
          y="302.8"
          width="61.6"
          height="204.7"
          rx="30.8"
          ry="30.8"
          transform="translate(616.7 593.2) rotate(141.2)"
        />
        <path
          class="st0"
          d="M410.3,529h180.2c110.4,0,200,89.6,200,200v39.3H210.3v-39.3c0-110.4,89.6-200,200-200Z"
        />
      </g>

      <path
        id="base"
        d="M861.9,766.7h-41.4v-37.6c0-61.4-23.9-119.2-67.4-162.6s-101.2-67.4-162.6-67.4h-180.2c-61.4,0-119.2,23.9-162.6,67.4-43.4,43.4-67.4,101.2-67.4,162.6v37.6h-41.4c-6.2,0-11.2,5-11.2,11.2v47.2c0,6.2,5,11.2,11.2,11.2h723c6.2,0,11.2-5,11.2-11.2v-47.2c0-6.2-5-11.2-11.2-11.2ZM240.3,729c0-93.7,76.3-170,170-170h180.2c93.7,0,170,76.3,170,170v9.3H240.3v-9.3Z"
      />
    </svg>
  );
}
