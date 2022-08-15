
/**
 * buffer elements and then send an array to the reader. 
 * @param count elements to buffer before enqueue
 */
export function skip<T>(count: number, highWaterMark = 16): (src:ReadableStream<T>)=>ReadableStream<T>{ 
  return function(src:ReadableStream<T>){
    let reader: ReadableStreamDefaultReader<T> = null;

    async function flush(controller: ReadableStreamDefaultController<T>) {
      try {
        while (controller.desiredSize > 0 && reader != null) {
          let next = await reader.read();
          if(next.done){
            controller.close();             
            reader = null;
                          
          }else {
            if(count > 0 ){
              count -= 1;
            }else{   
              controller.enqueue(next.value);     
            }      
          }          
        }     
      } catch (err) {
        controller.error(err);
      }
    }

    return new ReadableStream<T>({
      start(controller) {
        reader = src.getReader();
        return flush(controller);
      },
      pull(controller) {
        return flush(controller);
      },
      cancel(reason?:any) {
        if(reader){
          reader.cancel(reason);
          reader.releaseLock();
          reader = null;
        }
      }
    }, {highWaterMark});
  }
}